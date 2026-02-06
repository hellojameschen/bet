import Link from 'next/link'
import { TrendingUp, Flame, Clock, DollarSign } from 'lucide-react'
import prisma from '@/lib/db'
import { MarketGrid } from '@/components/markets/MarketGrid'
import { Button } from '@/components/ui/button'

async function getMarkets() {
  const markets = await prisma.market.findMany({
    where: { status: 'active' },
    orderBy: { volume: 'desc' },
    take: 9,
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

  return markets
}

async function getCategories() {
  return prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: {
        select: {
          markets: {
            where: { status: 'active' },
          },
        },
      },
    },
  })
}

async function getStats() {
  const [totalVolume, totalMarkets, totalTrades] = await Promise.all([
    prisma.market.aggregate({ _sum: { volume: true } }),
    prisma.market.count({ where: { status: 'active' } }),
    prisma.trade.count(),
  ])

  return {
    totalVolume: totalVolume._sum.volume || 0,
    totalMarkets,
    totalTrades,
  }
}

export default async function HomePage() {
  const [markets, categories, stats] = await Promise.all([
    getMarkets(),
    getCategories(),
    getStats(),
  ])

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-600 via-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Predict the Next Big IPO
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl mx-auto">
              Trade on IPO timing, valuations, and first-day performance. OpenAI, Stripe, SpaceX, and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/markets">
                <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100">
                  Explore Markets
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold">
                ${(stats.totalVolume / 1000000).toFixed(1)}M
              </div>
              <div className="text-white/70 text-sm mt-1">Trading Volume</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold">{stats.totalMarkets}</div>
              <div className="text-white/70 text-sm mt-1">Active Markets</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold">{stats.totalTrades}</div>
              <div className="text-white/70 text-sm mt-1">Total Trades</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Categories</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/markets?category=${category.slug}`}
              className="flex flex-col items-center p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow"
            >
              <span className="text-3xl mb-2">{category.icon}</span>
              <span className="font-medium text-sm">{category.name}</span>
              <span className="text-xs text-gray-500 mt-1">
                {category._count.markets} markets
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trending Markets */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" />
            <h2 className="text-2xl font-bold">Hot IPO Markets</h2>
          </div>
          <Link href="/markets">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>
        <MarketGrid markets={markets} />
      </section>

      {/* How it Works */}
      <section className="bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Pick an IPO</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Browse upcoming IPOs from OpenAI, Stripe, SpaceX, and other hot companies. Each market has clear resolution criteria.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Trade Your View</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Buy Yes or No shares. Think OpenAI IPOs in 2025? Buy Yes at 25¢ to win $1 if you're right.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Profit on News</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Prices move with news. Sell when sentiment shifts, or hold until the IPO happens for max payout.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl">IPO Markets</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2026 IPO Markets. For educational purposes only.
          </p>
        </div>
      </footer>
    </div>
  )
}
