import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try to find by slug first, then by ID
    const market = await prisma.market.findFirst({
      where: {
        OR: [{ slug: id }, { id: id }],
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        outcomes: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            currentPrice: true,
            totalShares: true,
          },
        },
        _count: {
          select: {
            trades: true,
            comments: true,
          },
        },
      },
    })

    if (!market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 })
    }

    // Get price history for chart
    const priceHistory = await prisma.priceHistory.findMany({
      where: { marketId: market.id },
      orderBy: { timestamp: 'asc' },
      take: 100,
      select: {
        timestamp: true,
        price: true,
        volume: true,
        outcomeId: true,
      },
    })

    // Get recent trades
    const recentTrades = await prisma.trade.findMany({
      where: { marketId: market.id },
      orderBy: { executedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        price: true,
        quantity: true,
        side: true,
        executedAt: true,
        outcome: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      ...market,
      priceHistory,
      recentTrades,
    })
  } catch (error) {
    console.error('Error fetching market:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market' },
      { status: 500 }
    )
  }
}
