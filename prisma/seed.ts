import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'politics' },
      update: {},
      create: {
        name: 'Politics',
        slug: 'politics',
        description: 'Elections, policy, and geopolitical events',
        icon: '🏛️',
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'sports' },
      update: {},
      create: {
        name: 'Sports',
        slug: 'sports',
        description: 'Games, championships, and player statistics',
        icon: '⚽',
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'crypto' },
      update: {},
      create: {
        name: 'Crypto',
        slug: 'crypto',
        description: 'Cryptocurrency prices and protocol events',
        icon: '₿',
        sortOrder: 3,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'tech' },
      update: {},
      create: {
        name: 'Tech',
        slug: 'tech',
        description: 'Technology and product launches',
        icon: '💻',
        sortOrder: 4,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'entertainment' },
      update: {},
      create: {
        name: 'Entertainment',
        slug: 'entertainment',
        description: 'Awards, box office, and celebrity events',
        icon: '🎬',
        sortOrder: 5,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'economics' },
      update: {},
      create: {
        name: 'Economics',
        slug: 'economics',
        description: 'Fed rates, GDP, and financial markets',
        icon: '📈',
        sortOrder: 6,
      },
    }),
  ])

  const [politics, sports, crypto, tech, entertainment, economics] = categories

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

  // Create markets with outcomes
  const markets = [
    {
      slug: 'will-trump-win-2028',
      question: 'Will Donald Trump win the 2028 Presidential Election?',
      description: 'This market resolves to "Yes" if Donald Trump is elected President of the United States in the 2028 general election.',
      categoryId: politics.id,
      resolutionTime: new Date('2028-11-10'),
      resolutionSource: 'Associated Press',
      resolutionCriteria: 'Resolves based on AP election call',
      imageUrl: '/markets/trump-2028.jpg',
      volume: 2450000,
      liquidity: 150000,
      outcomes: [
        { name: 'Yes', currentPrice: 0.35 },
        { name: 'No', currentPrice: 0.65 },
      ],
    },
    {
      slug: 'bitcoin-100k-2026',
      question: 'Will Bitcoin reach $100,000 in 2026?',
      description: 'This market resolves to "Yes" if Bitcoin (BTC) reaches or exceeds $100,000 USD on any major exchange before December 31, 2026.',
      categoryId: crypto.id,
      resolutionTime: new Date('2026-12-31'),
      resolutionSource: 'CoinGecko',
      resolutionCriteria: 'Based on CoinGecko BTC/USD price',
      imageUrl: '/markets/bitcoin.jpg',
      volume: 1850000,
      liquidity: 200000,
      outcomes: [
        { name: 'Yes', currentPrice: 0.72 },
        { name: 'No', currentPrice: 0.28 },
      ],
    },
    {
      slug: 'superbowl-2027-winner',
      question: 'Will the Kansas City Chiefs win Super Bowl LXI?',
      description: 'This market resolves to "Yes" if the Kansas City Chiefs win Super Bowl LXI in February 2027.',
      categoryId: sports.id,
      resolutionTime: new Date('2027-02-15'),
      resolutionSource: 'NFL Official',
      resolutionCriteria: 'Based on official NFL results',
      imageUrl: '/markets/chiefs.jpg',
      volume: 890000,
      liquidity: 75000,
      outcomes: [
        { name: 'Yes', currentPrice: 0.22 },
        { name: 'No', currentPrice: 0.78 },
      ],
    },
    {
      slug: 'fed-rate-cut-march-2026',
      question: 'Will the Fed cut rates in March 2026?',
      description: 'This market resolves to "Yes" if the Federal Reserve announces a rate cut at their March 2026 FOMC meeting.',
      categoryId: economics.id,
      resolutionTime: new Date('2026-03-20'),
      resolutionSource: 'Federal Reserve',
      resolutionCriteria: 'Based on official FOMC statement',
      imageUrl: '/markets/fed.jpg',
      volume: 520000,
      liquidity: 50000,
      outcomes: [
        { name: 'Yes', currentPrice: 0.45 },
        { name: 'No', currentPrice: 0.55 },
      ],
    },
    {
      slug: 'apple-vision-pro-2-2026',
      question: 'Will Apple release Vision Pro 2 in 2026?',
      description: 'This market resolves to "Yes" if Apple officially releases Apple Vision Pro 2 (or a successor device) before December 31, 2026.',
      categoryId: tech.id,
      resolutionTime: new Date('2026-12-31'),
      resolutionSource: 'Apple Official',
      resolutionCriteria: 'Based on official Apple announcement',
      imageUrl: '/markets/apple.jpg',
      volume: 340000,
      liquidity: 40000,
      outcomes: [
        { name: 'Yes', currentPrice: 0.68 },
        { name: 'No', currentPrice: 0.32 },
      ],
    },
    {
      slug: 'oscars-best-picture-2027',
      question: 'Will a streaming-only film win Best Picture at the 2027 Oscars?',
      description: 'This market resolves to "Yes" if a film released exclusively on a streaming platform wins Best Picture at the 99th Academy Awards.',
      categoryId: entertainment.id,
      resolutionTime: new Date('2027-03-01'),
      resolutionSource: 'Academy of Motion Picture Arts and Sciences',
      resolutionCriteria: 'Based on official Oscar results',
      imageUrl: '/markets/oscars.jpg',
      volume: 180000,
      liquidity: 25000,
      outcomes: [
        { name: 'Yes', currentPrice: 0.41 },
        { name: 'No', currentPrice: 0.59 },
      ],
    },
    {
      slug: 'ethereum-10k-2026',
      question: 'Will Ethereum reach $10,000 in 2026?',
      description: 'This market resolves to "Yes" if Ethereum (ETH) reaches or exceeds $10,000 USD before December 31, 2026.',
      categoryId: crypto.id,
      resolutionTime: new Date('2026-12-31'),
      resolutionSource: 'CoinGecko',
      resolutionCriteria: 'Based on CoinGecko ETH/USD price',
      imageUrl: '/markets/ethereum.jpg',
      volume: 720000,
      liquidity: 85000,
      outcomes: [
        { name: 'Yes', currentPrice: 0.38 },
        { name: 'No', currentPrice: 0.62 },
      ],
    },
    {
      slug: 'world-cup-2026-usa',
      question: 'Will the USA reach the World Cup 2026 Semi-Finals?',
      description: 'This market resolves to "Yes" if the USA Men\'s National Team reaches the semi-finals of the 2026 FIFA World Cup.',
      categoryId: sports.id,
      resolutionTime: new Date('2026-07-15'),
      resolutionSource: 'FIFA Official',
      resolutionCriteria: 'Based on official FIFA results',
      imageUrl: '/markets/worldcup.jpg',
      volume: 1200000,
      liquidity: 100000,
      outcomes: [
        { name: 'Yes', currentPrice: 0.28 },
        { name: 'No', currentPrice: 0.72 },
      ],
    },
  ]

  // Create market maker user (provides liquidity)
  const marketMaker = await prisma.user.upsert({
    where: { username: 'marketmaker' },
    update: {},
    create: {
      username: 'marketmaker',
      email: 'mm@polybet.com',
      passwordHash: await bcrypt.hash('mm-secret-password', 10),
      balance: 1000000, // $1M for market making
    },
  })

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

      // Create market maker orders (bids and asks) around the current price
      const basePrice = outcomes[i].currentPrice
      const spreads = [0.02, 0.04, 0.06, 0.08, 0.10] // 2%, 4%, 6%, 8%, 10% from mid

      // Delete existing orders for this outcome
      await prisma.order.deleteMany({
        where: { outcomeId: outcome.id, userId: marketMaker.id },
      })

      for (const spread of spreads) {
        // Buy orders (bids) below current price
        const bidPrice = Math.max(0.01, basePrice - spread)
        const bidQuantity = 100 + Math.random() * 200 // 100-300 shares

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
        const askQuantity = 100 + Math.random() * 200 // 100-300 shares

        // Market maker needs shares to sell - give them position
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
            shares: askQuantity * spreads.length, // Total shares for all ask orders
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

  console.log('Seed data created successfully!')
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
