import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create IPO-focused categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'ipo-timing' },
      update: {},
      create: {
        name: 'IPO Timing',
        slug: 'ipo-timing',
        description: 'When will companies go public?',
        icon: '📅',
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'ipo-valuation' },
      update: {},
      create: {
        name: 'IPO Valuation',
        slug: 'ipo-valuation',
        description: 'What will companies be worth at IPO?',
        icon: '💰',
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'first-day' },
      update: {},
      create: {
        name: 'First Day Performance',
        slug: 'first-day',
        description: 'How will IPOs perform on day one?',
        icon: '📈',
        sortOrder: 3,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'ipo-filing' },
      update: {},
      create: {
        name: 'IPO Filings',
        slug: 'ipo-filing',
        description: 'Will companies file for IPO?',
        icon: '📝',
        sortOrder: 4,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'spac-merger' },
      update: {},
      create: {
        name: 'SPAC & Direct Listings',
        slug: 'spac-merger',
        description: 'Alternative paths to public markets',
        icon: '🔄',
        sortOrder: 5,
      },
    }),
  ])

  const [ipoTiming, ipoValuation, firstDay, ipoFiling, spacMerger] = categories

  // Create demo user
  const passwordHash = await bcrypt.hash('password123', 10)
  const demoUser = await prisma.user.upsert({
    where: { username: 'demo' },
    update: {},
    create: {
      username: 'demo',
      email: 'demo@example.com',
      passwordHash,
      balance: 10000,
    },
  })

  // Create market maker user (provides liquidity)
  const marketMaker = await prisma.user.upsert({
    where: { username: 'marketmaker' },
    update: {},
    create: {
      username: 'marketmaker',
      email: 'mm@ipomarkets.com',
      passwordHash: await bcrypt.hash('mm-secret-password', 10),
      balance: 1000000,
    },
  })

  // IPO Markets
  const markets = [
    // OpenAI IPO Markets
    {
      slug: 'openai-ipo-2025',
      question: 'Will OpenAI IPO in 2025?',
      description: 'This market resolves to "Yes" if OpenAI announces and completes an Initial Public Offering before December 31, 2025.',
      categoryId: ipoTiming.id,
      resolutionTime: new Date('2025-12-31'),
      resolutionSource: 'SEC EDGAR Filings',
      resolutionCriteria: 'Based on official S-1 filing and completed IPO',
      volume: 2450000,
      liquidity: 150000,
      outcomes: [
        { name: 'Yes', currentPrice: 0.25 },
        { name: 'No', currentPrice: 0.75 },
      ],
    },
    {
      slug: 'openai-ipo-2026',
      question: 'Will OpenAI IPO in 2026?',
      description: 'This market resolves to "Yes" if OpenAI completes an IPO during calendar year 2026.',
      categoryId: ipoTiming.id,
      resolutionTime: new Date('2026-12-31'),
      resolutionSource: 'SEC EDGAR Filings',
      resolutionCriteria: 'Based on official S-1 filing and completed IPO',
      volume: 1850000,
      liquidity: 200000,
      outcomes: [
        { name: 'Yes', currentPrice: 0.55 },
        { name: 'No', currentPrice: 0.45 },
      ],
    },
    {
      slug: 'openai-valuation-200b',
      question: 'Will OpenAI IPO at $200B+ valuation?',
      description: 'This market resolves to "Yes" if OpenAI\'s IPO market cap exceeds $200 billion at the IPO price.',
      categoryId: ipoValuation.id,
      resolutionTime: new Date('2027-12-31'),
      resolutionSource: 'IPO Prospectus / Market Data',
      resolutionCriteria: 'Based on shares outstanding × IPO price',
      volume: 980000,
      liquidity: 100000,
      outcomes: [
        { name: 'Yes', currentPrice: 0.42 },
        { name: 'No', currentPrice: 0.58 },
      ],
    },

    // Stripe IPO Markets
    {
      slug: 'stripe-ipo-2025',
      question: 'Will Stripe IPO in 2025?',
      description: 'This market resolves to "Yes" if Stripe completes an IPO before December 31, 2025.',
      categoryId: ipoTiming.id,
      resolutionTime: new Date('2025-12-31'),
      resolutionSource: 'SEC EDGAR Filings',
      resolutionCriteria: 'Based on official S-1 filing and completed IPO',
      volume: 1200000,
      liquidity: 120000,
      outcomes: [
        { name: 'Yes', currentPrice: 0.35 },
        { name: 'No', currentPrice: 0.65 },
      ],
    },
    {
      slug: 'stripe-valuation-100b',
      question: 'Will Stripe IPO above $100B valuation?',
      description: 'This market resolves to "Yes" if Stripe\'s IPO market cap exceeds $100 billion.',
      categoryId: ipoValuation.id,
      resolutionTime: new Date('2027-12-31'),
      resolutionSource: 'IPO Prospectus / Market Data',
      resolutionCriteria: 'Based on shares outstanding × IPO price',
      volume: 650000,
      liquidity: 80000,
      outcomes: [
        { name: 'Yes', currentPrice: 0.48 },
        { name: 'No', currentPrice: 0.52 },
      ],
    },

    // SpaceX IPO Markets
    {
      slug: 'spacex-ipo-2027',
      question: 'Will SpaceX IPO by end of 2027?',
      description: 'This market resolves to "Yes" if SpaceX completes an IPO before December 31, 2027. Starlink spinoff IPO does not count.',
      categoryId: ipoTiming.id,
      resolutionTime: new Date('2027-12-31'),
      resolutionSource: 'SEC EDGAR Filings',
      resolutionCriteria: 'SpaceX parent company IPO only',
      volume: 890000,
      liquidity: 90000,
      outcomes: [
        { name: 'Yes', currentPrice: 0.20 },
        { name: 'No', currentPrice: 0.80 },
      ],
    },
    {
      slug: 'starlink-ipo-2026',
      question: 'Will Starlink IPO in 2026?',
      description: 'This market resolves to "Yes" if Starlink (SpaceX subsidiary) completes an IPO during 2026.',
      categoryId: ipoTiming.id,
      resolutionTime: new Date('2026-12-31'),
      resolutionSource: 'SEC EDGAR Filings',
      resolutionCriteria: 'Based on Starlink spinoff IPO',
      volume: 720000,
      liquidity: 85000,
      outcomes: [
        { name: 'Yes', currentPrice: 0.38 },
        { name: 'No', currentPrice: 0.62 },
      ],
    },

    // Anthropic IPO
    {
      slug: 'anthropic-ipo-2026',
      question: 'Will Anthropic IPO in 2026?',
      description: 'This market resolves to "Yes" if Anthropic (Claude AI) completes an IPO during 2026.',
      categoryId: ipoTiming.id,
      resolutionTime: new Date('2026-12-31'),
      resolutionSource: 'SEC EDGAR Filings',
      resolutionCriteria: 'Based on official IPO completion',
      volume: 560000,
      liquidity: 70000,
      outcomes: [
        { name: 'Yes', currentPrice: 0.22 },
        { name: 'No', currentPrice: 0.78 },
      ],
    },

    // Reddit First Day Performance (example of resolved/upcoming)
    {
      slug: 'discord-ipo-2026',
      question: 'Will Discord IPO in 2026?',
      description: 'This market resolves to "Yes" if Discord completes an IPO during 2026.',
      categoryId: ipoTiming.id,
      resolutionTime: new Date('2026-12-31'),
      resolutionSource: 'SEC EDGAR Filings',
      resolutionCriteria: 'Based on official IPO completion',
      volume: 420000,
      liquidity: 60000,
      outcomes: [
        { name: 'Yes', currentPrice: 0.30 },
        { name: 'No', currentPrice: 0.70 },
      ],
    },

    // Databricks
    {
      slug: 'databricks-ipo-2025',
      question: 'Will Databricks IPO in 2025?',
      description: 'This market resolves to "Yes" if Databricks completes an IPO before December 31, 2025.',
      categoryId: ipoTiming.id,
      resolutionTime: new Date('2025-12-31'),
      resolutionSource: 'SEC EDGAR Filings',
      resolutionCriteria: 'Based on official IPO completion',
      volume: 580000,
      liquidity: 75000,
      outcomes: [
        { name: 'Yes', currentPrice: 0.45 },
        { name: 'No', currentPrice: 0.55 },
      ],
    },

    // First Day Performance Markets
    {
      slug: 'next-ai-ipo-pop-50',
      question: 'Will the next major AI company IPO pop 50%+ on day 1?',
      description: 'Resolves "Yes" if the next AI company valued over $10B at IPO closes 50% or more above IPO price on first trading day. Applies to OpenAI, Anthropic, or other major AI IPO.',
      categoryId: firstDay.id,
      resolutionTime: new Date('2026-12-31'),
      resolutionSource: 'Stock market data',
      resolutionCriteria: 'First day closing price vs IPO price',
      volume: 340000,
      liquidity: 50000,
      outcomes: [
        { name: 'Yes', currentPrice: 0.35 },
        { name: 'No', currentPrice: 0.65 },
      ],
    },

    // Filing Markets
    {
      slug: 'openai-s1-q1-2025',
      question: 'Will OpenAI file S-1 by end of Q1 2025?',
      description: 'This market resolves to "Yes" if OpenAI files an S-1 registration statement with the SEC before March 31, 2025.',
      categoryId: ipoFiling.id,
      resolutionTime: new Date('2025-03-31'),
      resolutionSource: 'SEC EDGAR',
      resolutionCriteria: 'S-1 filing appears on EDGAR',
      volume: 890000,
      liquidity: 95000,
      outcomes: [
        { name: 'Yes', currentPrice: 0.15 },
        { name: 'No', currentPrice: 0.85 },
      ],
    },

    // Shein
    {
      slug: 'shein-ipo-2025',
      question: 'Will Shein complete its London IPO in 2025?',
      description: 'This market resolves to "Yes" if Shein completes its IPO on the London Stock Exchange in 2025.',
      categoryId: ipoTiming.id,
      resolutionTime: new Date('2025-12-31'),
      resolutionSource: 'LSE / Official announcements',
      resolutionCriteria: 'IPO completion on London Stock Exchange',
      volume: 450000,
      liquidity: 55000,
      outcomes: [
        { name: 'Yes', currentPrice: 0.60 },
        { name: 'No', currentPrice: 0.40 },
      ],
    },

    // Klarna
    {
      slug: 'klarna-ipo-h1-2025',
      question: 'Will Klarna IPO in H1 2025?',
      description: 'This market resolves to "Yes" if Klarna completes its US IPO before June 30, 2025.',
      categoryId: ipoTiming.id,
      resolutionTime: new Date('2025-06-30'),
      resolutionSource: 'SEC EDGAR / NYSE',
      resolutionCriteria: 'IPO completion',
      volume: 680000,
      liquidity: 80000,
      outcomes: [
        { name: 'Yes', currentPrice: 0.72 },
        { name: 'No', currentPrice: 0.28 },
      ],
    },
  ]

  for (const marketData of markets) {
    const { outcomes, ...market } = marketData
    
    const createdMarket = await prisma.market.upsert({
      where: { slug: market.slug },
      update: {},
      create: market,
    })

    for (let i = 0; i < outcomes.length; i++) {
      const outcome = await prisma.outcome.upsert({
        where: {
          id: `${createdMarket.id}-outcome-${i}`,
        },
        update: {
          currentPrice: outcomes[i].currentPrice,
        },
        create: {
          id: `${createdMarket.id}-outcome-${i}`,
          marketId: createdMarket.id,
          name: outcomes[i].name,
          currentPrice: outcomes[i].currentPrice,
          sortOrder: i,
        },
      })

      // Create market maker orders around the current price
      const basePrice = outcomes[i].currentPrice
      const spreads = [0.02, 0.04, 0.06, 0.08, 0.10]

      // Delete existing orders for this outcome
      await prisma.order.deleteMany({
        where: { outcomeId: outcome.id, userId: marketMaker.id },
      })

      for (const spread of spreads) {
        // Buy orders (bids) below current price
        const bidPrice = Math.max(0.01, basePrice - spread)
        const bidQuantity = 100 + Math.random() * 200

        await prisma.order.create({
          data: {
            userId: marketMaker.id,
            marketId: createdMarket.id,
            outcomeId: outcome.id,
            side: 'buy',
            type: 'limit',
            price: Math.round(bidPrice * 100) / 100,
            quantity: Math.round(bidQuantity),
            filledQuantity: 0,
            status: 'open',
          },
        })

        // Sell orders (asks) above current price
        const askPrice = Math.min(0.99, basePrice + spread)
        const askQuantity = 100 + Math.random() * 200

        // Market maker needs shares to sell
        await prisma.position.upsert({
          where: {
            userId_outcomeId: {
              userId: marketMaker.id,
              outcomeId: outcome.id,
            },
          },
          update: {
            shares: { increment: askQuantity },
          },
          create: {
            userId: marketMaker.id,
            marketId: createdMarket.id,
            outcomeId: outcome.id,
            shares: askQuantity * spreads.length,
            avgEntryPrice: basePrice,
          },
        })

        await prisma.order.create({
          data: {
            userId: marketMaker.id,
            marketId: createdMarket.id,
            outcomeId: outcome.id,
            side: 'sell',
            type: 'limit',
            price: Math.round(askPrice * 100) / 100,
            quantity: Math.round(askQuantity),
            filledQuantity: 0,
            status: 'open',
          },
        })
      }
    }
  }

  console.log('IPO Markets seed data created successfully!')
  console.log('Market maker orders placed for liquidity.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
