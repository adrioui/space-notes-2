import { NextRequest, NextResponse } from 'next/server'
import { otpService } from '@/lib/otp-service-demo'
import { findUserByContact } from '@/lib/auth'
import { z } from 'zod'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const verifyOTPSchema = z.object({
  contact: z.string().min(1, 'Contact is required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contact, otp } = verifyOTPSchema.parse(body)

    console.log('🎭 DEMO VERIFY OTP: Complete bypass for:', contact, 'OTP:', otp)

    // Validate OTP format (any 6-digit code)
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        {
          success: false,
          message: 'OTP must be 6 digits'
        },
        { status: 400 }
      )
    }

    // Complete bypass - always return success for any 6-digit OTP
    const isDemoAccount = ['demo-admin@example.com', 'demo-member@example.com'].includes(contact.toLowerCase())

    if (isDemoAccount) {
      console.log('🎭 DEMO VERIFY OTP: Demo account verified')
      const isAdmin = contact.toLowerCase() === 'demo-admin@example.com'

      return NextResponse.json(
        {
          success: true,
          message: 'Demo account verified successfully',
          user: {
            id: isAdmin ? '550e8400-e29b-41d4-a716-446655440001' : '550e8400-e29b-41d4-a716-446655440002',
            email: contact,
            name: isAdmin ? 'Demo Admin' : 'Demo Member',
            role: isAdmin ? 'admin' : 'member'
          },
          isNewUser: false
        },
        { status: 200 }
      )
    }

    // For regular accounts, return success without database check
    console.log('🎭 DEMO VERIFY OTP: Regular account verified')
    return NextResponse.json(
      {
        success: true,
        message: 'OTP verified successfully (Demo mode)',
        contact: contact,
        isNewUser: true,
        requiresProfileCompletion: true
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Verify OTP error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: error.errors[0]?.message || 'Invalid request data'
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    )
  }
}