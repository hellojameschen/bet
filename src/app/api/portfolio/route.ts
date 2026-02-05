import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import prisma from '@/lib/db'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get positions with market info
    const positions = await prisma.position.findMany({
      where: {
        userId: user.id,
        shares: { gt: 0 },
      },
      include: {
        outcome: {
          select: {
            id: true,
            name: true,
            currentPrice: true,
          },
        },
        market: {
          select: {
            id: true,
            slug: true,
            question: true,
            status: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    // Get recent trades
    const trades = await prisma.trade.findMany({
      where: { userId: user.id },
      orderBy: { executedAt: 'desc' },
      take: 50,
      include: {
        market: {
          select: {
            id: true,
            slug: true,
            question: true,
          },
        },
        outcome: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Calculate portfolio metrics
    let totalValue = user.balance
    let totalUnrealizedPnl = 0
    let totalRealizedPnl = 0

    const positionsWithPnl = positions.map((pos) => {
      const currentValue = pos.shares * pos.outcome.currentPrice
      const costBasis = pos.shares * pos.avgEntryPrice
      const unrealizedPnl = currentValue - costBasis

      totalValue += currentValue
      totalUnrealizedPnl += unrealizedPnl
      totalRealizedPnl += pos.realizedPnl

      return {
        ...pos,
        currentValue,
        unrealizedPnl,
        unrealizedPnlPercent: costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0,
      }
    })

    return NextResponse.json({
      balance: user.balance,
      totalValue,
      totalUnrealizedPnl,
      totalRealizedPnl,
      positions: positionsWithPnl,
      trades,
    })
  } catch (error) {
    console.error('Portfolio error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    )
  }
}
