import { NextRequest, NextResponse } from 'next/server'
import { createUserFromContact } from '@/lib/auth'
import { insertUserSchema } from '@shared/schema'
import { z } from 'zod'

const completeProfileSchema = z.object({
  contact: z.string().min(1, 'Contact is required'),
  displayName: z.string().min(1, 'Display name is required'),
  username: z.string().min(1, 'Username is required'),
  avatarType: z.string().default('emoji'),
  avatarData: z.any().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contact, ...profileData } = completeProfileSchema.parse(body)

    // Create user with the provided contact and profile data
    const newUser = await createUserFromContact(contact, profileData)

    return NextResponse.json({
      success: true,
      user: newUser
    }, { status: 201 })
  } catch (error) {
    console.error('Complete profile error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid profile data',
          errors: error.errors
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