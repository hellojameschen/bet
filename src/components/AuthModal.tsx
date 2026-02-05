'use client'

import { useState } from 'react'
import { Modal, ModalHeader, ModalTitle, ModalDescription } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/lib/store'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { setUser } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: mode,
          email,
          username: mode === 'register' ? username : undefined,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed')
      }

      setUser(data.user)
      onClose()
      setEmail('')
      setUsername('')
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader>
        <ModalTitle>{mode === 'login' ? 'Log In' : 'Create Account'}</ModalTitle>
        <ModalDescription>
          {mode === 'login' 
            ? 'Welcome back! Enter your credentials to continue.'
            : 'Create an account to start trading.'}
        </ModalDescription>
      </ModalHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="johndoe"
              required
              minLength={3}
              maxLength={20}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Loading...' : mode === 'login' ? 'Log In' : 'Create Account'}
        </Button>

        <div className="text-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          </span>
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError(null)
            }}
            className="text-blue-600 hover:underline font-medium"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </div>

        {mode === 'login' && (
          <div className="pt-2 border-t dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Demo: demo@example.com / password123
            </p>
          </div>
        )}
      </form>
    </Modal>
  )
}
