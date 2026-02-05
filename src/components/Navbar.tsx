'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrendingUp, Search, User, Menu, X, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthModal } from '@/components/AuthModal'
import { useAuthStore } from '@/lib/store'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function Navbar() {
  const pathname = usePathname()
  const { user, setUser, setLoading, logout } = useAuthStore()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    // Fetch current user on mount
    fetch('/api/auth')
      .then(res => res.json())
      .then(data => {
        setUser(data.user)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [setUser, setLoading])

  const handleLogout = async () => {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    })
    logout()
    setShowUserMenu(false)
  }

  const navLinks = [
    { href: '/', label: 'Markets' },
    { href: '/markets?category=politics', label: 'Politics' },
    { href: '/markets?category=crypto', label: 'Crypto' },
    { href: '/markets?category=sports', label: 'Sports' },
  ]

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-xl hidden sm:block">Polybet</span>
              </Link>

              {/* Desktop Nav Links */}
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href))
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-900"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search markets..." 
                  className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <Link href="/portfolio">
                    <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      {formatCurrency(user.balance)}
                    </Button>
                  </Link>
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      <span className="hidden sm:block">{user.username}</span>
                    </Button>
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 py-1 z-50">
                        <Link
                          href="/portfolio"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Portfolio
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          Log out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Button onClick={() => setShowAuthModal(true)} size="sm">
                  Log In
                </Button>
              )}

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 py-4">
            <div className="px-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 text-base font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
                  onClick={() => setShowMobileMenu(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  )
}
