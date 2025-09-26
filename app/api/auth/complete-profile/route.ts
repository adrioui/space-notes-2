import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, insertUserSchema } from '@shared/schema'
import { z } from 'zod'

const completeProfileSchema = insertUserSchema.omit({
  id: true,
  email: true,
  phone: true,
  emailVerified: true,
  image: true,
  createdAt: true,
  updatedAt: true,
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const userData = completeProfileSchema.parse(body)

    // Create user with the authenticated email/phone
    const result = await db
      .insert(users)
      .values({
        ...userData,
        email: session.user.email || null,
        phone: null, // Will be set if user used phone auth
      })
      .returning()

    const newUser = result[0]

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