'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { format } from 'date-fns'

interface PriceHistoryItem {
  timestamp: string
  price: number
  volume: number
  outcomeId: string
}

interface PriceChartProps {
  data: PriceHistoryItem[]
  outcomeId: string
}

export function PriceChart({ data, outcomeId }: PriceChartProps) {
  const chartData = useMemo(() => {
    const filtered = data
      .filter(d => d.outcomeId === outcomeId)
      .map(d => ({
        time: new Date(d.timestamp).getTime(),
        price: d.price * 100,
        volume: d.volume,
      }))
      .sort((a, b) => a.time - b.time)

    // Add starting point if no data
    if (filtered.length === 0) {
      return [
        { time: Date.now() - 86400000, price: 50, volume: 0 },
        { time: Date.now(), price: 50, volume: 0 },
      ]
    }

    return filtered
  }, [data, outcomeId])

  const priceChange = chartData.length > 1 
    ? chartData[chartData.length - 1].price - chartData[0].price 
    : 0

  const isPositive = priceChange >= 0

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop 
                offset="5%" 
                stopColor={isPositive ? "#22c55e" : "#ef4444"} 
                stopOpacity={0.3}
              />
              <stop 
                offset="95%" 
                stopColor={isPositive ? "#22c55e" : "#ef4444"} 
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="time" 
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(value) => format(new Date(value), 'MMM d')}
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={45}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload
                return (
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-lg">
                    <p className="text-xs text-gray-500">
                      {format(new Date(data.time), 'MMM d, yyyy h:mm a')}
                    </p>
                    <p className="text-sm font-semibold">
                      {data.price.toFixed(1)}%
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={isPositive ? "#22c55e" : "#ef4444"}
            strokeWidth={2}
            fill="url(#colorPrice)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
