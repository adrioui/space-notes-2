import { NextRequest, NextResponse } from 'next/server'
import { otpService } from '@/lib/otp-service'
import { signIn } from 'next-auth/react'
import { z } from 'zod'

const verifyOTPSchema = z.object({
  contact: z.string().min(1, 'Contact is required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contact, otp } = verifyOTPSchema.parse(body)

    const result = otpService.verifyOTP(contact, otp)

    if (result.success && result.user) {
      // OTP verification successful - return user data for NextAuth
      return NextResponse.json(
        { 
          success: true, 
          message: result.message,
          user: result.user
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: result.message 
        },
        { status: 400 }
      )
    }
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