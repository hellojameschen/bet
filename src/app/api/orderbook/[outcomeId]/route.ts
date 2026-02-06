import { NextRequest, NextResponse } from 'next/server'
import { getOrderBook } from '@/lib/orderbook'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ outcomeId: string }> }
) {
  try {
    const { outcomeId } = await params
    const orderBook = await getOrderBook(outcomeId)
    
    return NextResponse.json(orderBook)
  } catch (error) {
    console.error('Error fetching order book:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order book' },
      { status: 500 }
    )
  }
}
