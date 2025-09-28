'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import OTPForm from './otp-form-client'

export default function AuthPageClient() {
  const [mounted, setMounted] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()

  // Debug logging for NextAuth session (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 AuthPageClient mounted at:', new Date().toISOString())
      console.log('🔍 Initial session status:', status)
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Session status changed:', status)
    }

    if (status === 'authenticated') {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ User authenticated, redirecting to dashboard')
      }
      router.push('/dashboard')
    }
  }, [status, session, router])

  // Check if NextAuth is properly initialized (only in development and only once)
  useEffect(() => {
    const checkNextAuthEndpoints = async () => {
      if (process.env.NODE_ENV !== 'development') return

      try {
        console.log('🌐 Testing NextAuth endpoints...')

        // Test session endpoint
        const sessionResponse = await fetch('/api/auth/session')
        if (sessionResponse.ok) {
          console.log('📡 Session endpoint: OK')
        }

        // Test providers endpoint
        const providersResponse = await fetch('/api/auth/providers')
        if (providersResponse.ok) {
          console.log('📡 Providers endpoint: OK')
        }

      } catch (error) {
        console.error('❌ NextAuth endpoint error:', error)
      }
    }

    if (mounted) {
      checkNextAuthEndpoints()
    }
  }, [mounted])

  // Prevent hydration mismatch
  if (!mounted) {
    console.log('⏳ Component not yet mounted, showing loading...')
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (status === 'loading') {
    console.log('⏳ Session loading, showing spinner...')
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <div className="ml-4 text-sm text-gray-600">
          Loading session... (Check console for debug info)
        </div>
      </div>
    )
  }

  console.log('✅ Rendering OTP form')
  return (
    <div className="min-h-screen flex items-center justify-center bg-background" data-testid="auth-page">
      <OTPForm />
    </div>
  )
}