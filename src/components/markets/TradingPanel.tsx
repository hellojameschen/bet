'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/lib/store'
import { formatCurrency, formatProbability } from '@/lib/utils'
import { OrderBook } from './OrderBook'

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
  const [orderType, setOrderType] = useState<'market' | 'limit'>('limit')
  const [amount, setAmount] = useState('')
  const [limitPrice, setLimitPrice] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const selectedOutcomeData = outcomes.find(o => o.id === selectedOutcome)
  const price = orderType === 'limit' && limitPrice 
    ? parseFloat(limitPrice) / 100 
    : selectedOutcomeData?.currentPrice || 0.5
  const shares = amount ? parseFloat(amount) / price : 0
  const potentialReturn = shares * (1 - price)

  const handlePriceClick = (clickedPrice: number, clickedSide: 'buy' | 'sell') => {
    setLimitPrice((clickedPrice * 100).toFixed(0))
    // If clicking on asks (red), you want to buy. If clicking on bids (green), you want to sell.
    setSide(clickedSide)
    setOrderType('limit')
  }

  const handleTrade = async () => {
    if (!user) {
      setError('Please log in to trade')
      return
    }

    if (!selectedOutcome || !amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (orderType === 'limit' && (!limitPrice || parseFloat(limitPrice) <= 0 || parseFloat(limitPrice) >= 100)) {
      setError('Please enter a valid price (1-99)')
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
          type: orderType,
          quantity: shares,
          price: orderType === 'limit' ? parseFloat(limitPrice) / 100 : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Trade failed')
      }

      // Show success message
      setSuccess(data.message || 'Order placed successfully!')
      
      // Update user balance
      const userRes = await fetch('/api/auth')
      const userData = await userRes.json()
      if (userData.user) {
        setUser(userData.user)
      }

      setAmount('')
      if (orderType === 'market') {
        // Update local prices after market order
        if (data.avgPrice) {
          setOutcomes(prev => prev.map(o => {
            if (o.id === selectedOutcome) {
              return { ...o, currentPrice: data.avgPrice }
            }
            return { ...o, currentPrice: 1 - data.avgPrice }
          }))
        }
      }
      
      onTradeComplete?.()
      router.refresh()

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trade failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Trading Panel */}
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

        {/* Order Type Toggle */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant={orderType === 'limit' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setOrderType('limit')}
            className="flex-1"
          >
            Limit
          </Button>
          <Button
            variant={orderType === 'market' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setOrderType('market')}
            className="flex-1"
          >
            Market
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

        {/* Limit Price Input */}
        {orderType === 'limit' && (
          <div className="space-y-2 mb-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Price (¢)
            </label>
            <Input
              type="number"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder="e.g. 65 for 65¢"
              min="1"
              max="99"
              step="1"
            />
            <p className="text-xs text-gray-500">
              {side === 'buy' 
                ? 'Your order will fill when someone sells at or below this price'
                : 'Your order will fill when someone buys at or above this price'}
            </p>
          </div>
        )}

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

        {amount && parseFloat(amount) > 0 && price > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Shares</span>
              <span className="font-medium">{shares.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                {orderType === 'limit' ? 'Limit Price' : 'Est. Price'}
              </span>
              <span className="font-medium">{formatProbability(price)}</span>
            </div>
            {side === 'buy' && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Max Profit</span>
                <span className="font-medium text-green-600">
                  +{formatCurrency(potentialReturn)} ({((potentialReturn / parseFloat(amount)) * 100).toFixed(0)}%)
                </span>
              </div>
            )}
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg p-3 mb-4 text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg p-3 mb-4 text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          onClick={handleTrade}
          disabled={isLoading || !amount || parseFloat(amount) <= 0 || !user || (orderType === 'limit' && !limitPrice)}
          className="w-full"
          variant={side === 'buy' ? 'success' : 'destructive'}
        >
          {isLoading 
            ? 'Processing...' 
            : !user 
              ? 'Log in to trade' 
              : `${side === 'buy' ? 'Buy' : 'Sell'} ${selectedOutcomeData?.name || ''}`}
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

        {orderType === 'limit' && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Limit Order:</strong> Your order will wait in the book until another trader matches it. 
              No trade happens until a buyer and seller agree on price.
            </p>
          </div>
        )}

        {orderType === 'market' && (
          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              <strong>Market Order:</strong> Executes immediately against existing limit orders. 
              Fails if no matching orders in the book.
            </p>
          </div>
        )}
      </div>

      {/* Order Book */}
      {selectedOutcome && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <OrderBook
            outcomeId={selectedOutcome}
            outcomeName={selectedOutcomeData?.name || ''}
            onPriceClick={handlePriceClick}
          />
        </div>
      )}
    </div>
  )
}
