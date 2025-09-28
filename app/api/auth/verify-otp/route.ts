import { NextRequest, NextResponse } from 'next/server'
import { otpService } from '@/lib/otp-service-demo'
import { findUserByContact } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@shared/schema'
import { eq } from 'drizzle-orm'
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
      console.log('🎭 DEMO VERIFY OTP: Demo account verified, looking up user in database')

      try {
        // Look up the actual demo user from the database
        const demoUser = await db
          .select({
            id: users.id,
            email: users.email,
            displayName: users.displayName,
            username: users.username,
          })
          .from(users)
          .where(eq(users.email, contact.toLowerCase()))
          .limit(1)

        if (demoUser.length > 0) {
          const user = demoUser[0]
          console.log(`🎭 DEMO VERIFY OTP: Found demo user in database: ${user.id}`)

          const isAdmin = contact.toLowerCase() === 'demo-admin@example.com'

          return NextResponse.json(
            {
              success: true,
              message: 'Demo account verified successfully',
              user: {
                id: user.id, // Use actual database ID
                email: user.email,
                name: user.displayName || (isAdmin ? 'Demo Admin' : 'Demo Member'),
                role: isAdmin ? 'admin' : 'member'
              },
              isNewUser: false
            },
            { status: 200 }
          )
        } else {
          console.log('🎭 DEMO VERIFY OTP: Demo user not found in database, creating...')

          // Demo user doesn't exist, create them
          const isAdmin = contact.toLowerCase() === 'demo-admin@example.com'
          const newUser = {
            email: contact.toLowerCase(),
            displayName: isAdmin ? 'Demo Admin' : 'Demo Member',
            username: isAdmin ? 'demo-admin' : 'demo-member',
            avatarType: 'emoji' as const,
            avatarData: {
              emoji: isAdmin ? '👑' : '👤',
              backgroundColor: isAdmin ? '#6366F1' : '#10B981'
            },
          }

          const createdUsers = await db.insert(users).values(newUser).returning()
          const createdUser = createdUsers[0]

          console.log(`🎭 DEMO VERIFY OTP: Created demo user: ${createdUser.id}`)

          return NextResponse.json(
            {
              success: true,
              message: 'Demo account created and verified successfully',
              user: {
                id: createdUser.id, // Use actual database ID
                email: createdUser.email,
                name: createdUser.displayName,
                role: isAdmin ? 'admin' : 'member'
              },
              isNewUser: true
            },
            { status: 200 }
          )
        }
      } catch (dbError) {
        console.error('🎭 DEMO VERIFY OTP: Database error:', dbError)
        return NextResponse.json(
          {
            success: false,
            message: 'Database error during demo account verification'
          },
          { status: 500 }
        )
      }
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