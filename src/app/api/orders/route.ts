import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { placeLimitOrder, placeMarketOrder, matchOrders, cancelOrder } from '@/lib/orderbook'
import { orderSchema } from '@/lib/types'
import prisma from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = orderSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { marketId, outcomeId, side, type, quantity, price } = result.data

    if (type === 'limit') {
      if (!price) {
        return NextResponse.json(
          { error: 'Price required for limit orders' },
          { status: 400 }
        )
      }

      // Place the limit order
      const order = await placeLimitOrder(
        user.id,
        marketId,
        outcomeId,
        side,
        price,
        quantity
      )

      // Try to match orders
      const trades = await matchOrders(outcomeId)

      return NextResponse.json({
        success: true,
        order,
        trades,
        message: trades.length > 0 
          ? `Order placed and ${trades.length} trade(s) executed` 
          : 'Order placed in book, waiting for match',
      })
    } else {
      // Market order
      const result = await placeMarketOrder(
        user.id,
        marketId,
        outcomeId,
        side,
        quantity
      )

      return NextResponse.json({
        success: true,
        trades: result.trades,
        filledQuantity: result.filledQuantity,
        totalCost: result.totalCost,
        totalProceeds: result.totalProceeds,
        avgPrice: result.avgPrice,
        remainingQuantity: result.remainingQuantity,
        message: result.remainingQuantity > 0
          ? `Partially filled: ${result.filledQuantity} of ${quantity}`
          : 'Order fully filled',
      })
    }
  } catch (error) {
    console.error('Order error:', error)
    const message = error instanceof Error ? error.message : 'Order failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'open'

    const orders = await prisma.order.findMany({
      where: {
        userId: user.id,
        status: status === 'all' ? undefined : status,
      },
      include: {
        market: {
          select: { id: true, slug: true, question: true },
        },
        outcome: {
          select: { id: true, name: true, currentPrice: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    await cancelOrder(user.id, orderId)

    return NextResponse.json({ success: true, message: 'Order cancelled' })
  } catch (error) {
    console.error('Cancel order error:', error)
    const message = error instanceof Error ? error.message : 'Failed to cancel'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
