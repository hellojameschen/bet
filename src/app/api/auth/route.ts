import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/db'
import { signToken } from '@/lib/auth'
import { registerSchema, loginSchema } from '@/lib/types'

// Register
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const action = body.action

    if (action === 'register') {
      const result = registerSchema.safeParse(body)
      if (!result.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: result.error.flatten() },
          { status: 400 }
        )
      }

      const { email, username, password } = result.data

      // Check if user exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'User already exists' },
          { status: 409 }
        )
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10)

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash,
          balance: 10000, // Starting balance
        },
        select: {
          id: true,
          username: true,
          email: true,
          balance: true,
        },
      })

      // Generate token
      const token = signToken({ userId: user.id, username: user.username })

      const response = NextResponse.json({ user })
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      return response
    } else if (action === 'login') {
      const result = loginSchema.safeParse(body)
      if (!result.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: result.error.flatten() },
          { status: 400 }
        )
      }

      const { email, password } = result.data

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user || !user.passwordHash) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.passwordHash)
      if (!validPassword) {
        return NextResponse.json(
          { error: 'Invalid credentials' },
          { status: 401 }
        )
      }

      // Generate token
      const token = signToken({ userId: user.id, username: user.username })

      const response = NextResponse.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          balance: user.balance,
        },
      })

      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })

      return response
    } else if (action === 'logout') {
      const response = NextResponse.json({ success: true })
      response.cookies.delete('auth_token')
      return response
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

// Get current user
export async function GET() {
  try {
    const { getCurrentUser } = await import('@/lib/auth')
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error getting user:', error)
    return NextResponse.json({ user: null })
  }
}
