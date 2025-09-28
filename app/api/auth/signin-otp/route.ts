import { NextRequest, NextResponse } from 'next/server'
import { signIn } from 'next-auth/react'
import { z } from 'zod'

const signInOTPSchema = z.object({
  contact: z.string().min(1, 'Contact is required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  action: z.enum(['verify', 'complete-profile']).default('verify'),
  profileData: z.object({
    displayName: z.string().min(1, 'Display name is required'),
    username: z.string().min(1, 'Username is required'),
    avatarType: z.enum(['emoji', 'upload']).default('emoji'),
    avatarData: z.any().optional(),
  }).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contact, otp, action, profileData } = signInOTPSchema.parse(body)

    // Use NextAuth signIn with credentials
    const result = await signIn('otp', {
      contact,
      otp,
      action,
      profileData: profileData ? JSON.stringify(profileData) : undefined,
      redirect: false,
    })

    if (result?.error) {
      if (result.error === 'PROFILE_INCOMPLETE') {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Profile completion required',
            requiresProfileCompletion: true,
            contact: contact
          },
          { status: 200 }
        )
      }

      return NextResponse.json(
        { 
          success: false, 
          message: result.error 
        },
        { status: 400 }
      )
    }

    if (result?.ok) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'Authentication successful',
          url: result.url
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        message: 'Authentication failed' 
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('SignIn OTP error:', error)
    
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
