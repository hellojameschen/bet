import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const status = searchParams.get('status') || 'active'
    const sort = searchParams.get('sort') || 'volume'
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {
      status,
    }

    if (category) {
      where.category = { slug: category }
    }

    if (search) {
      where.OR = [
        { question: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const orderBy: Record<string, string> = {}
    switch (sort) {
      case 'volume':
        orderBy.volume = 'desc'
        break
      case 'newest':
        orderBy.createdAt = 'desc'
        break
      case 'ending':
        orderBy.resolutionTime = 'asc'
        break
      case 'liquidity':
        orderBy.liquidity = 'desc'
        break
      default:
        orderBy.volume = 'desc'
    }

    const [markets, total] = await Promise.all([
      prisma.market.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
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
        },
      }),
      prisma.market.count({ where }),
    ])

    return NextResponse.json({
      markets,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching markets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch markets' },
      { status: 500 }
    )
  }
}
