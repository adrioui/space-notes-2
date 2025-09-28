import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptionsBypass } from '@/lib/auth-bypass'
import { db } from '@/lib/db'
import { users } from '@shared/schema'
import { eq } from 'drizzle-orm'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Ensure we're in a runtime environment (not build time)
    if (typeof window !== 'undefined') {
      return NextResponse.json(
        { message: 'This endpoint is server-side only' },
        { status: 400 }
      )
    }

    const session = await getServerSession(authOptionsBypass)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    const user = result[0]
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}