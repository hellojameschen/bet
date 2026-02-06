'use client'

import { useEffect, useState } from 'react'
import { formatProbability, formatNumber } from '@/lib/utils'

interface OrderBookEntry {
  price: number
  quantity: number
  orders: number
}

interface OrderBookData {
  bids: OrderBookEntry[]
  asks: OrderBookEntry[]
  spread: number | null
  lastPrice: number | null
}

interface OrderBookProps {
  outcomeId: string
  outcomeName: string
  onPriceClick?: (price: number, side: 'buy' | 'sell') => void
}

export function OrderBook({ outcomeId, outcomeName, onPriceClick }: OrderBookProps) {
  const [data, setData] = useState<OrderBookData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchOrderBook = async () => {
    try {
      const res = await fetch(`/api/orderbook/${outcomeId}`)
      const orderBook = await res.json()
      setData(orderBook)
    } catch (error) {
      console.error('Failed to fetch order book:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrderBook()
    // Refresh every 5 seconds
    const interval = setInterval(fetchOrderBook, 5000)
    return () => clearInterval(interval)
  }, [outcomeId])

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-6 bg-gray-200 dark:bg-gray-800 rounded" />
        ))}
      </div>
    )
  }

  const maxQuantity = Math.max(
    ...((data?.bids || []).map(b => b.quantity)),
    ...((data?.asks || []).map(a => a.quantity)),
    1
  )

  return (
    <div className="text-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">{outcomeName} Order Book</h3>
        {data?.spread !== null && (
          <span className="text-xs text-gray-500">
            Spread: {formatProbability(data.spread)}
          </span>
        )}
      </div>

      {/* Header */}
      <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2 px-2">
        <div>Price</div>
        <div className="text-right">Quantity</div>
        <div className="text-right">Orders</div>
      </div>

      {/* Asks (sell orders) - shown in reverse so lowest is at bottom */}
      <div className="space-y-0.5 mb-2">
        {(data?.asks || []).slice(0, 5).reverse().map((ask, i) => (
          <div
            key={`ask-${i}`}
            className="relative grid grid-cols-3 gap-2 px-2 py-1 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            onClick={() => onPriceClick?.(ask.price, 'buy')}
          >
            <div
              className="absolute inset-y-0 right-0 bg-red-100 dark:bg-red-900/30 rounded-r"
              style={{ width: `${(ask.quantity / maxQuantity) * 100}%` }}
            />
            <div className="relative text-red-600 dark:text-red-400 font-mono">
              {formatProbability(ask.price)}
            </div>
            <div className="relative text-right font-mono">{formatNumber(ask.quantity)}</div>
            <div className="relative text-right text-gray-500">{ask.orders}</div>
          </div>
        ))}
        {(!data?.asks || data.asks.length === 0) && (
          <div className="text-center text-gray-400 py-2 text-xs">No sell orders</div>
        )}
      </div>

      {/* Spread indicator */}
      <div className="border-y dark:border-gray-800 py-2 my-2 text-center">
        {data?.lastPrice ? (
          <span className="font-semibold">{formatProbability(data.lastPrice)}</span>
        ) : (
          <span className="text-gray-400">No trades yet</span>
        )}
      </div>

      {/* Bids (buy orders) */}
      <div className="space-y-0.5">
        {(data?.bids || []).slice(0, 5).map((bid, i) => (
          <div
            key={`bid-${i}`}
            className="relative grid grid-cols-3 gap-2 px-2 py-1 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
            onClick={() => onPriceClick?.(bid.price, 'sell')}
          >
            <div
              className="absolute inset-y-0 right-0 bg-green-100 dark:bg-green-900/30 rounded-r"
              style={{ width: `${(bid.quantity / maxQuantity) * 100}%` }}
            />
            <div className="relative text-green-600 dark:text-green-400 font-mono">
              {formatProbability(bid.price)}
            </div>
            <div className="relative text-right font-mono">{formatNumber(bid.quantity)}</div>
            <div className="relative text-right text-gray-500">{bid.orders}</div>
          </div>
        ))}
        {(!data?.bids || data.bids.length === 0) && (
          <div className="text-center text-gray-400 py-2 text-xs">No buy orders</div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">
        Click a price to set your order
      </p>
    </div>
  )
}
