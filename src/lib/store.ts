import { create } from 'zustand'
import type { User } from './types'

interface AuthState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null }),
}))

interface TradeModalState {
  isOpen: boolean
  marketId: string | null
  outcomeId: string | null
  outcomeName: string | null
  side: 'buy' | 'sell'
  openTrade: (marketId: string, outcomeId: string, outcomeName: string, side: 'buy' | 'sell') => void
  closeTrade: () => void
}

export const useTradeModalStore = create<TradeModalState>((set) => ({
  isOpen: false,
  marketId: null,
  outcomeId: null,
  outcomeName: null,
  side: 'buy',
  openTrade: (marketId, outcomeId, outcomeName, side) =>
    set({ isOpen: true, marketId, outcomeId, outcomeName, side }),
  closeTrade: () =>
    set({ isOpen: false, marketId: null, outcomeId: null, outcomeName: null }),
}))
