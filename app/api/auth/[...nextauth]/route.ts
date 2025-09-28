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

// Create NextAuth handler - let it handle its own routes
const handler = NextAuth(authOptionsBypass)

// Export the handler directly for NextAuth to manage its internal routes
export { handler as GET, handler as POST }