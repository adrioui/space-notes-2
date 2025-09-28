import { NextRequest, NextResponse } from 'next/server'
import { otpService } from '@/lib/otp-service'
import { findUserByContact } from '@/lib/auth'
import { z } from 'zod'

const verifyOTPSchema = z.object({
  contact: z.string().min(1, 'Contact is required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contact, otp } = verifyOTPSchema.parse(body)

    // Verify OTP first
    const otpResult = otpService.verifyOTP(contact, otp)

    if (!otpResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: otpResult.message
        },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await findUserByContact(contact)

    if (existingUser) {
      // Existing user - return success with user data
      return NextResponse.json(
        {
          success: true,
          message: 'OTP verified successfully',
          user: existingUser,
          isNewUser: false
        },
        { status: 200 }
      )
    } else {
      // New user - indicate profile completion needed
      return NextResponse.json(
        {
          success: true,
          message: 'OTP verified successfully',
          contact: contact,
          isNewUser: true,
          requiresProfileCompletion: true
        },
        { status: 200 }
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