import { NextRequest, NextResponse } from 'next/server'
import { otpService } from '@/lib/otp-service-demo'
import { z } from 'zod'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const sendOTPSchema = z.object({
  contact: z.string().min(1, 'Contact is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contact } = sendOTPSchema.parse(body)

    console.log('🎭 DEMO SEND OTP: Complete bypass for:', contact)

    // Complete bypass - always return success without calling any services
    const isDemoAccount = ['demo-admin@example.com', 'demo-member@example.com'].includes(contact.toLowerCase())

    if (isDemoAccount) {
      console.log('🎭 DEMO SEND OTP: Demo account detected')
      return NextResponse.json({
        success: true,
        message: "Demo account detected! Use any 6-digit code to sign in.",
        debugOTP: "123456"
      }, { status: 200 })
    }

    // For regular accounts, also return success
    console.log('🎭 DEMO SEND OTP: Regular account, returning success')
    return NextResponse.json({
      success: true,
      message: "OTP sent successfully! (Demo mode - use any 6-digit code)",
      debugOTP: "123456"
    }, { status: 200 })
  } catch (error) {
    console.error('Send OTP error:', error)
    
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