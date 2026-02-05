import { Suspense } from 'react'
import prisma from '@/lib/db'
import { MarketGrid } from '@/components/markets/MarketGrid'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface SearchParams {
  category?: string
  sort?: string
  search?: string
}

async function getMarkets(searchParams: SearchParams) {
  const { category, sort = 'volume', search } = searchParams

  const where: Record<string, unknown> = {
    status: 'active',
  }

  if (category) {
    where.category = { slug: category }
  }

  if (search) {
    where.OR = [
      { question: { contains: search } },
      { description: { contains: search } },
    ]
  }

  const orderBy: Record<string, string> = {}
  switch (sort) {
    case 'volume':
      orderBy.volume = 'desc'
      break
    case 'newest':
      orderBy.createdAt = 'desc'
      break
    case 'ending':
      orderBy.resolutionTime = 'asc'
      break
    default:
      orderBy.volume = 'desc'
  }

  const markets = await prisma.market.findMany({
    where,
    orderBy,
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

export default async function MarketsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const [markets, categories] = await Promise.all([
    getMarkets(params),
    getCategories(),
  ])

  const currentCategory = params.category
  const currentSort = params.sort || 'volume'

  const sortOptions = [
    { value: 'volume', label: 'Most Active' },
    { value: 'newest', label: 'Newest' },
    { value: 'ending', label: 'Ending Soon' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {currentCategory
          ? categories.find((c) => c.slug === currentCategory)?.name || 'Markets'
          : 'All Markets'}
      </h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          <Link href="/markets">
            <Button
              variant={!currentCategory ? 'default' : 'outline'}
              size="sm"
            >
              All
            </Button>
          </Link>
          {categories.map((category) => (
            <Link key={category.id} href={`/markets?category=${category.slug}`}>
              <Button
                variant={currentCategory === category.slug ? 'default' : 'outline'}
                size="sm"
              >
                {category.icon} {category.name}
              </Button>
            </Link>
          ))}
        </div>

        {/* Sort */}
        <div className="flex gap-2 sm:ml-auto">
          {sortOptions.map((option) => (
            <Link
              key={option.value}
              href={`/markets?${currentCategory ? `category=${currentCategory}&` : ''}sort=${option.value}`}
            >
              <Button
                variant={currentSort === option.value ? 'secondary' : 'ghost'}
                size="sm"
              >
                {option.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Markets Grid */}
      <Suspense fallback={<div>Loading...</div>}>
        <MarketGrid markets={markets} />
      </Suspense>
    </div>
  )
}
