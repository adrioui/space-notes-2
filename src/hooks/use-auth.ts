'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface OTPAuthState {
  isLoading: boolean
  error: string | null
  step: 'contact' | 'otp' | 'profile' | 'complete'
  contact: string | null
  requiresProfileCompletion: boolean
}

interface ProfileData {
  displayName: string
  username: string
  avatarType: 'emoji' | 'upload'
  avatarData?: any
}

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [otpState, setOtpState] = useState<OTPAuthState>({
    isLoading: false,
    error: null,
    step: 'contact',
    contact: null,
    requiresProfileCompletion: false,
  })

  const sendOTP = useCallback(async (contact: string) => {
    setOtpState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setOtpState(prev => ({
          ...prev,
          isLoading: false,
          step: 'otp',
          contact,
        }))
        return { success: true, message: result.message }
      } else {
        setOtpState(prev => ({ ...prev, isLoading: false, error: result.message }))
        return { success: false, message: result.message }
      }
    } catch (error) {
      const message = 'Failed to send OTP. Please try again.'
      setOtpState(prev => ({ ...prev, isLoading: false, error: message }))
      return { success: false, message }
    }
  }, [])

  const verifyOTP = useCallback(async (otp: string) => {
    if (!otpState.contact) {
      throw new Error('No contact information available')
    }

    setOtpState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contact: otpState.contact, 
          otp 
        }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        if (result.isNewUser && result.requiresProfileCompletion) {
          // New user needs to complete profile
          setOtpState(prev => ({
            ...prev,
            isLoading: false,
            step: 'profile',
            requiresProfileCompletion: true,
          }))
          return { 
            success: true, 
            requiresProfileCompletion: true,
            message: result.message 
          }
        } else {
          // Existing user - sign them in with NextAuth
          const signInResult = await signIn('otp', {
            contact: otpState.contact,
            otp,
            action: 'verify',
            redirect: false,
          })
          
          if (signInResult?.ok) {
            setOtpState(prev => ({ ...prev, isLoading: false, step: 'complete' }))
            router.push('/spaces')
            return { success: true, message: 'Authentication successful' }
          } else {
            throw new Error(signInResult?.error || 'Authentication failed')
          }
        }
      } else {
        setOtpState(prev => ({ ...prev, isLoading: false, error: result.message }))
        return { success: false, message: result.message }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify OTP'
      setOtpState(prev => ({ ...prev, isLoading: false, error: message }))
      return { success: false, message }
    }
  }, [otpState.contact, router])

  const completeProfile = useCallback(async (profileData: ProfileData) => {
    if (!otpState.contact) {
      throw new Error('No contact information available')
    }

    setOtpState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      // First create the user profile
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contact: otpState.contact,
          ...profileData 
        }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Now sign them in with NextAuth
        const signInResult = await signIn('otp', {
          contact: otpState.contact,
          otp: 'verified', // OTP already verified in previous step
          action: 'complete-profile',
          profileData: JSON.stringify(profileData),
          redirect: false,
        })
        
        if (signInResult?.ok) {
          setOtpState(prev => ({ ...prev, isLoading: false, step: 'complete' }))
          router.push('/spaces')
          return { success: true, message: 'Profile completed successfully' }
        } else {
          throw new Error(signInResult?.error || 'Authentication failed')
        }
      } else {
        setOtpState(prev => ({ ...prev, isLoading: false, error: result.message }))
        return { success: false, message: result.message }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete profile'
      setOtpState(prev => ({ ...prev, isLoading: false, error: message }))
      return { success: false, message }
    }
  }, [otpState.contact, router])

  const logout = useCallback(async () => {
    await signOut({ redirect: false })
    setOtpState({
      isLoading: false,
      error: null,
      step: 'contact',
      contact: null,
      requiresProfileCompletion: false,
    })
    router.push('/')
  }, [router])

  const resetOTPFlow = useCallback(() => {
    setOtpState({
      isLoading: false,
      error: null,
      step: 'contact',
      contact: null,
      requiresProfileCompletion: false,
    })
  }, [])

  return {
    // Session data
    session,
    user: session?.user || null,
    isAuthenticated: !!session?.user,
    isLoading: status === 'loading' || otpState.isLoading,
    
    // OTP flow state
    otpState,
    
    // Actions
    sendOTP,
    verifyOTP,
    completeProfile,
    logout,
    resetOTPFlow,
  }
}
