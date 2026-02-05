'use client'

import { MarketCard } from './MarketCard'

interface Market {
  id: string
  slug: string
  question: string
  volume: number
  resolutionTime: string | Date
  category: {
    name: string
    slug: string
  }
  outcomes: {
    id: string
    name: string
    currentPrice: number
  }[]
}

interface MarketGridProps {
  markets: Market[]
}

export function MarketGrid({ markets }: MarketGridProps) {
  if (markets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No markets found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {markets.map((market) => (
        <MarketCard key={market.id} market={market} />
      ))}
    </div>
  )
}
