import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptionsBypass } from '@/lib/auth-bypass'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    console.log('Custom session debug route called')
    console.log('Request headers:', Object.fromEntries(request.headers.entries()))
    
    // Try to get session
    const session = await getServerSession(authOptionsBypass)
    console.log('Session result:', session)
    
    return NextResponse.json({
      session,
      timestamp: new Date().toISOString(),
      success: true,
    })
  } catch (error) {
    console.error('Session debug error:', error)
    return NextResponse.json({
      error: 'Session fetch failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      success: false,
    }, { status: 500 })
  }
}
