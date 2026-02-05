'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/lib/store'
import { formatCurrency, formatProbability } from '@/lib/utils'

interface Outcome {
  id: string
  name: string
  currentPrice: number
}

interface TradingPanelProps {
  marketId: string
  outcomes: Outcome[]
  onTradeComplete?: () => void
}

export function TradingPanel({ marketId, outcomes: initialOutcomes, onTradeComplete }: TradingPanelProps) {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const [outcomes, setOutcomes] = useState(initialOutcomes)
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(initialOutcomes[0]?.id || null)
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const selectedOutcomeData = outcomes.find(o => o.id === selectedOutcome)
  const price = selectedOutcomeData?.currentPrice || 0.5
  const shares = amount ? parseFloat(amount) / price : 0
  const potentialReturn = shares * (1 - price)

  const handleTrade = async () => {
    if (!user) {
      setError('Please log in to trade')
      return
    }

    if (!selectedOutcome || !amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId,
          outcomeId: selectedOutcome,
          side,
          type: 'market',
          quantity: shares,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Trade failed')
      }

      // Show success message
      const cost = side === 'buy' ? data.totalCost : data.totalProceeds
      setSuccess(`${side === 'buy' ? 'Bought' : 'Sold'} ${shares.toFixed(2)} shares for ${formatCurrency(cost)}`)
      
      // Update local outcome prices
      setOutcomes(prev => prev.map(o => {
        if (o.id === selectedOutcome) {
          return { ...o, currentPrice: data.newPrice }
        }
        // Update the other outcome price (1 - newPrice for binary markets)
        return { ...o, currentPrice: 1 - data.newPrice }
      }))

      // Update user balance
      const userRes = await fetch('/api/auth')
      const userData = await userRes.json()
      if (userData.user) {
        setUser(userData.user)
      }

      setAmount('')
      onTradeComplete?.()
      
      // Refresh the page data
      router.refresh()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trade failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant={side === 'buy' ? 'success' : 'outline'}
          size="sm"
          onClick={() => setSide('buy')}
          className="flex-1"
        >
          Buy
        </Button>
        <Button
          variant={side === 'sell' ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => setSide('sell')}
          className="flex-1"
        >
          Sell
        </Button>
      </div>

      <div className="space-y-3 mb-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Outcome
        </label>
        <div className="grid grid-cols-2 gap-2">
          {outcomes.map((outcome) => (
            <button
              key={outcome.id}
              onClick={() => setSelectedOutcome(outcome.id)}
              className={`p-3 rounded-lg border-2 transition-colors ${
                selectedOutcome === outcome.id
                  ? outcome.name === 'Yes'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="text-sm font-medium">{outcome.name}</div>
              <div className={`text-lg font-bold ${
                outcome.name === 'Yes' ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatProbability(outcome.currentPrice)}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Amount ($)
        </label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          min="0"
          step="1"
        />
        <div className="flex gap-2">
          {[10, 25, 50, 100].map((preset) => (
            <Button
              key={preset}
              variant="outline"
              size="sm"
              onClick={() => setAmount(preset.toString())}
              className="flex-1"
            >
              ${preset}
            </Button>
          ))}
        </div>
      </div>

      {amount && parseFloat(amount) > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Shares</span>
            <span className="font-medium">{shares.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Avg Price</span>
            <span className="font-medium">{formatProbability(price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Potential Return</span>
            <span className="font-medium text-green-600">
              +{formatCurrency(potentialReturn)} ({((potentialReturn / parseFloat(amount)) * 100).toFixed(0)}%)
            </span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg p-3 mb-4 text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <Button
        onClick={handleTrade}
        disabled={isLoading || !amount || parseFloat(amount) <= 0 || !user}
        className="w-full"
        variant={side === 'buy' ? 'success' : 'destructive'}
      >
        {isLoading ? 'Processing...' : !user ? 'Log in to trade' : `${side === 'buy' ? 'Buy' : 'Sell'} ${selectedOutcomeData?.name || ''}`}
      </Button>

      {user ? (
        <div className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
          Balance: {formatCurrency(user.balance)}
        </div>
      ) : (
        <div className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400">
          Log in to start trading
        </div>
      )}
    </div>
  )
}
