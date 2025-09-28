import { NextRequest, NextResponse } from 'next/server'
import { authOptionsBypass } from '@/lib/auth-bypass'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Basic health check for NextAuth configuration
    const config = authOptionsBypass
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      nextauth: {
        providers: config.providers?.length || 0,
        session_strategy: config.session?.strategy || 'unknown',
        has_secret: !!config.secret,
        has_callbacks: !!(config.callbacks?.jwt && config.callbacks?.session),
      },
      environment: {
        node_env: process.env.NODE_ENV,
        nextauth_url: process.env.NEXTAUTH_URL || 'not_set',
        has_nextauth_secret: !!process.env.NEXTAUTH_SECRET,
      }
    })
  } catch (error) {
    console.error('NextAuth health check error:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
