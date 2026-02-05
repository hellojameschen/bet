import { z } from 'zod'

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  password: z.string().min(6),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

// Trading schemas
export const orderSchema = z.object({
  marketId: z.string(),
  outcomeId: z.string(),
  side: z.enum(['buy', 'sell']),
  type: z.enum(['market', 'limit']),
  quantity: z.number().positive(),
  price: z.number().min(0.01).max(0.99).optional(),
})

// Response types
export type Market = {
  id: string
  slug: string
  question: string
  description: string | null
  resolutionTime: Date
  status: string
  volume: number
  liquidity: number
  imageUrl: string | null
  category: {
    id: string
    name: string
    slug: string
  }
  outcomes: Outcome[]
}

export type Outcome = {
  id: string
  name: string
  currentPrice: number
  totalShares: number
}

export type Position = {
  id: string
  shares: number
  avgEntryPrice: number
  realizedPnl: number
  outcome: Outcome
  market: {
    id: string
    slug: string
    question: string
    status: string
  }
}

export type Trade = {
  id: string
  price: number
  quantity: number
  side: string
  executedAt: Date
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

export type User = {
  id: string
  username: string
  email: string | null
  avatarUrl: string | null
  balance: number
}
