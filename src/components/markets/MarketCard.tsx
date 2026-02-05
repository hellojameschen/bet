'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatNumber, formatTimeRemaining, formatProbability } from '@/lib/utils'

interface Outcome {
  id: string
  name: string
  currentPrice: number
}

interface MarketCardProps {
  market: {
    id: string
    slug: string
    question: string
    volume: number
    resolutionTime: string | Date
    category: {
      name: string
      slug: string
    }
    outcomes: Outcome[]
  }
}

export function MarketCard({ market }: MarketCardProps) {
  const yesOutcome = market.outcomes.find(o => o.name === 'Yes')
  const noOutcome = market.outcomes.find(o => o.name === 'No')
  const primaryOutcome = yesOutcome || market.outcomes[0]
  const probability = primaryOutcome?.currentPrice || 0.5

  const isHighProbability = probability > 0.5

  return (
    <Link href={`/markets/${market.slug}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <Badge variant="secondary" className="text-xs">
              {market.category.name}
            </Badge>
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <Clock className="h-3 w-3 mr-1" />
              {formatTimeRemaining(new Date(market.resolutionTime))}
            </div>
          </div>
          
          <h3 className="font-medium text-gray-900 dark:text-white mb-4 line-clamp-2 min-h-[48px]">
            {market.question}
          </h3>
          
          <div className="space-y-2">
            {/* Probability bar */}
            <div className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <div 
                className={`absolute inset-y-0 left-0 ${isHighProbability ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${probability * 100}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-3 text-sm font-medium">
                <span className={probability > 0.3 ? 'text-white' : 'text-gray-700 dark:text-gray-300'}>
                  Yes {formatProbability(probability)}
                </span>
                <span className={probability < 0.7 ? 'text-white' : 'text-gray-700 dark:text-gray-300'}>
                  No {formatProbability(1 - probability)}
                </span>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center">
                {isHighProbability ? (
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                )}
                {formatProbability(probability)} chance
              </span>
              <span>{formatCurrency(market.volume)} Vol</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
