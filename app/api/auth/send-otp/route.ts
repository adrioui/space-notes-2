import { NextRequest, NextResponse } from 'next/server'
import { otpService } from '@/lib/otp-service'
import { z } from 'zod'

const sendOTPSchema = z.object({
  contact: z.string().min(1, 'Contact is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contact } = sendOTPSchema.parse(body)

    const result = await otpService.sendOTP(contact)

    if (result.success) {
      // In development mode, include the OTP code for debugging
      const responseData: any = {
        success: true,
        message: result.message
      }

      if (process.env.NODE_ENV === 'development' && result.debugOTP) {
        responseData.debugOTP = result.debugOTP
      }

      return NextResponse.json(responseData, { status: 200 })
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