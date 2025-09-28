// Disable SES lockdown before importing NextAuth
if (typeof globalThis !== 'undefined') {
  ;(globalThis as any).DISABLE_SES_LOCKDOWN = true
}

import NextAuth from 'next-auth'
import { authOptionsBypass } from '@/lib/auth-bypass'
import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for NextAuth routes
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Create NextAuth handler with error wrapping
const nextAuthHandler = NextAuth(authOptionsBypass)

// Wrap handlers with error catching for better debugging
async function GET(request: NextRequest) {
  try {
    console.log('NextAuth GET request:', request.url)
    return await nextAuthHandler(request)
  } catch (error) {
    console.error('NextAuth GET error:', error)
    return NextResponse.json(
      {
        error: 'NextAuth configuration error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

async function POST(request: NextRequest) {
  try {
    console.log('NextAuth POST request:', request.url)
    return await nextAuthHandler(request)
  } catch (error) {
    console.error('NextAuth POST error:', error)
    return NextResponse.json(
      {
        error: 'NextAuth configuration error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export { GET, POST }