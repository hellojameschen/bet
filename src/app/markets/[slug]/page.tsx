import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, ExternalLink, Share2 } from 'lucide-react'
import prisma from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TradingPanel } from '@/components/markets/TradingPanel'
import { PriceChart } from '@/components/markets/PriceChart'
import { formatCurrency, formatTimeRemaining, formatProbability } from '@/lib/utils'
import { format } from 'date-fns'

async function getMarket(slug: string) {
  const market = await prisma.market.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
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
    },
  })

  if (!market) return null

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

  const recentTrades = await prisma.trade.findMany({
    where: { marketId: market.id },
    orderBy: { executedAt: 'desc' },
    take: 10,
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

  return { ...market, priceHistory, recentTrades }
}

export default async function MarketPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const market = await getMarket(slug)

  if (!market) {
    notFound()
  }

  const yesOutcome = market.outcomes.find((o) => o.name === 'Yes')
  const noOutcome = market.outcomes.find((o) => o.name === 'No')

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/markets"
        className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Markets
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary">{market.category.name}</Badge>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Clock className="h-4 w-4 mr-1" />
                {formatTimeRemaining(new Date(market.resolutionTime))}
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-4">
              {market.question}
            </h1>
            {market.description && (
              <p className="text-gray-600 dark:text-gray-400">
                {market.description}
              </p>
            )}
          </div>

          {/* Probability display */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                {yesOutcome && (
                  <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800">
                    <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                      Yes
                    </div>
                    <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                      {formatProbability(yesOutcome.currentPrice)}
                    </div>
                  </div>
                )}
                {noOutcome && (
                  <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800">
                    <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                      No
                    </div>
                    <div className="text-3xl font-bold text-red-700 dark:text-red-300">
                      {formatProbability(noOutcome.currentPrice)}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Stats row */}
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 pt-4 border-t dark:border-gray-800">
                <div>
                  <span className="font-medium">Volume:</span> {formatCurrency(market.volume)}
                </div>
                <div>
                  <span className="font-medium">Liquidity:</span> {formatCurrency(market.liquidity)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Price History</CardTitle>
            </CardHeader>
            <CardContent>
              <PriceChart
                data={market.priceHistory.map(p => ({
                  ...p,
                  timestamp: p.timestamp.toISOString(),
                }))}
                outcomeId={yesOutcome?.id || market.outcomes[0]?.id}
              />
            </CardContent>
          </Card>

          {/* Resolution info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resolution Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Resolution Date
                </div>
                <div>{format(new Date(market.resolutionTime), 'MMMM d, yyyy')}</div>
              </div>
              {market.resolutionSource && (
                <div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Resolution Source
                  </div>
                  <div className="flex items-center gap-1">
                    {market.resolutionSource}
                    <ExternalLink className="h-3 w-3" />
                  </div>
                </div>
              )}
              {market.resolutionCriteria && (
                <div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Resolution Criteria
                  </div>
                  <div>{market.resolutionCriteria}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent trades */}
          {market.recentTrades.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {market.recentTrades.map((trade) => (
                    <div
                      key={trade.id}
                      className="flex items-center justify-between py-2 border-b dark:border-gray-800 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={trade.side === 'buy' ? 'success' : 'destructive'}
                          className="text-xs"
                        >
                          {trade.side.toUpperCase()}
                        </Badge>
                        <span className="font-medium">{trade.outcome.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {trade.quantity.toFixed(2)} @ {formatProbability(trade.price)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(trade.executedAt), 'MMM d, h:mm a')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Trading Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <TradingPanel
              marketId={market.id}
              outcomes={market.outcomes}
            />

            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
