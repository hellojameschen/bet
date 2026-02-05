import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { executeMarketOrder } from '@/lib/trading'
import { orderSchema } from '@/lib/types'

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

    const { marketId, outcomeId, side, type, quantity } = result.data

    if (type === 'market') {
      const tradeResult = await executeMarketOrder(
        user.id,
        marketId,
        outcomeId,
        side,
        quantity
      )

      return NextResponse.json({
        success: true,
        trade: tradeResult.trade,
        executedPrice: tradeResult.executedPrice,
        ...(side === 'buy' ? { totalCost: tradeResult.totalCost } : { totalProceeds: tradeResult.totalProceeds }),
        newPrice: tradeResult.newPrice,
      })
    } else {
      // Limit orders - for future implementation
      return NextResponse.json(
        { error: 'Limit orders not yet implemented' },
        { status: 501 }
      )
    }
  } catch (error) {
    console.error('Order error:', error)
    const message = error instanceof Error ? error.message : 'Order failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
