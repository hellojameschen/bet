'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, History, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/store'
import { formatCurrency, formatProbability } from '@/lib/utils'
import { format } from 'date-fns'

interface Position {
  id: string
  shares: number
  avgEntryPrice: number
  realizedPnl: number
  currentValue: number
  unrealizedPnl: number
  unrealizedPnlPercent: number
  outcome: {
    id: string
    name: string
    currentPrice: number
  }
  market: {
    id: string
    slug: string
    question: string
    status: string
  }
}

interface Trade {
  id: string
  price: number
  quantity: number
  side: string
  executedAt: string
  market: {
    id: string
    slug: string
    question: string
  }
  outcome: {
    id: string
    name: string
  }
}

interface PortfolioData {
  balance: number
  totalValue: number
  totalUnrealizedPnl: number
  totalRealizedPnl: number
  positions: Position[]
  trades: Trade[]
}

export default function PortfolioPage() {
  const { user } = useAuthStore()
  const [data, setData] = useState<PortfolioData | null>(null)
  const [activeTab, setActiveTab] = useState<'positions' | 'history'>('positions')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetch('/api/portfolio')
        .then((res) => res.json())
        .then((data) => {
          setData(data)
          setIsLoading(false)
        })
        .catch(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [user])

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <Wallet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign in to view your portfolio</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Track your positions, view trade history, and manage your balance.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">Failed to load portfolio</div>
      </div>
    )
  }

  const totalPnl = data.totalUnrealizedPnl + data.totalRealizedPnl
  const pnlPercent = data.balance > 0 ? (totalPnl / (data.totalValue - totalPnl)) * 100 : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Portfolio</h1>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(data.totalValue)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Cash Balance</p>
                <p className="text-2xl font-bold">{formatCurrency(data.balance)}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Unrealized P&L</p>
                <p className={`text-2xl font-bold ${data.totalUnrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {data.totalUnrealizedPnl >= 0 ? '+' : ''}{formatCurrency(data.totalUnrealizedPnl)}
                </p>
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                data.totalUnrealizedPnl >= 0 
                  ? 'bg-green-100 dark:bg-green-900/30' 
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                {data.totalUnrealizedPnl >= 0 
                  ? <ArrowUpRight className="h-5 w-5 text-green-600" />
                  : <ArrowDownRight className="h-5 w-5 text-red-600" />
                }
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total P&L</p>
                <p className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)}
                </p>
                <p className={`text-sm ${totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'positions' ? 'default' : 'outline'}
          onClick={() => setActiveTab('positions')}
        >
          Positions ({data.positions.length})
        </Button>
        <Button
          variant={activeTab === 'history' ? 'default' : 'outline'}
          onClick={() => setActiveTab('history')}
        >
          <History className="h-4 w-4 mr-2" />
          Trade History
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'positions' ? (
        <Card>
          <CardHeader>
            <CardTitle>Active Positions</CardTitle>
          </CardHeader>
          <CardContent>
            {data.positions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  You don&apos;t have any active positions
                </p>
                <Link href="/markets">
                  <Button>Explore Markets</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-800">
                      <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Market</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Position</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Shares</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Avg Price</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Current</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Value</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.positions.map((position) => (
                      <tr key={position.id} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                        <td className="py-3 px-4">
                          <Link 
                            href={`/markets/${position.market.slug}`}
                            className="font-medium hover:text-blue-600 line-clamp-1"
                          >
                            {position.market.question}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={position.outcome.name === 'Yes' ? 'success' : 'destructive'}>
                            {position.outcome.name}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {position.shares.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {formatProbability(position.avgEntryPrice)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {formatProbability(position.outcome.currentPrice)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {formatCurrency(position.currentValue)}
                        </td>
                        <td className={`py-3 px-4 text-right font-mono ${
                          position.unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {position.unrealizedPnl >= 0 ? '+' : ''}
                          {formatCurrency(position.unrealizedPnl)}
                          <span className="text-xs ml-1">
                            ({position.unrealizedPnlPercent >= 0 ? '+' : ''}
                            {position.unrealizedPnlPercent.toFixed(1)}%)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Trade History</CardTitle>
          </CardHeader>
          <CardContent>
            {data.trades.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  No trades yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.trades.map((trade) => (
                  <div
                    key={trade.id}
                    className="flex items-center justify-between py-3 border-b dark:border-gray-800 last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <Badge variant={trade.side === 'buy' ? 'success' : 'destructive'}>
                        {trade.side.toUpperCase()}
                      </Badge>
                      <div>
                        <Link 
                          href={`/markets/${trade.market.slug}`}
                          className="font-medium hover:text-blue-600 line-clamp-1"
                        >
                          {trade.market.question}
                        </Link>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {trade.outcome.name} • {trade.quantity.toFixed(2)} shares @ {formatProbability(trade.price)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(trade.price * trade.quantity)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(trade.executedAt), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
