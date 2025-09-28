import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@shared/schema'
import { eq } from 'drizzle-orm'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const DEMO_USERS = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'demo-admin@example.com',
    displayName: 'Demo Admin',
    username: 'demo-admin',
    avatarType: 'emoji' as const,
    avatarData: { emoji: '👑', backgroundColor: '#6366F1' },
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'demo-member@example.com',
    displayName: 'Demo Member',
    username: 'demo-member',
    avatarType: 'emoji' as const,
    avatarData: { emoji: '👤', backgroundColor: '#10B981' },
  },
]

export async function POST(request: NextRequest) {
  try {
    console.log('🎭 Creating demo users in database...')
    
    const results = []
    
    for (const demoUser of DEMO_USERS) {
      try {
        // Check if user already exists
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.id, demoUser.id))
          .limit(1)
        
        if (existingUser.length > 0) {
          console.log(`✅ Demo user ${demoUser.email} already exists`)
          
          // Update existing user to ensure data is current
          await db
            .update(users)
            .set({
              email: demoUser.email,
              displayName: demoUser.displayName,
              username: demoUser.username,
              avatarType: demoUser.avatarType,
              avatarData: demoUser.avatarData,
            })
            .where(eq(users.id, demoUser.id))
          
          results.push({
            action: 'updated',
            user: demoUser.email,
            id: demoUser.id,
          })
        } else {
          // Create new user
          await db.insert(users).values(demoUser)
          console.log(`✨ Created demo user ${demoUser.email}`)
          
          results.push({
            action: 'created',
            user: demoUser.email,
            id: demoUser.id,
          })
        }
      } catch (userError) {
        console.error(`Error processing user ${demoUser.email}:`, userError)
        results.push({
          action: 'error',
          user: demoUser.email,
          id: demoUser.id,
          error: userError instanceof Error ? userError.message : 'Unknown error',
        })
      }
    }
    
    // Verify users exist
    const verification = []
    for (const demoUser of DEMO_USERS) {
      try {
        const user = await db
          .select({
            id: users.id,
            email: users.email,
            displayName: users.displayName,
          })
          .from(users)
          .where(eq(users.id, demoUser.id))
          .limit(1)
        
        if (user.length > 0) {
          verification.push({
            status: 'found',
            ...user[0],
          })
        } else {
          verification.push({
            status: 'missing',
            id: demoUser.id,
            email: demoUser.email,
          })
        }
      } catch (error) {
        verification.push({
          status: 'error',
          id: demoUser.id,
          email: demoUser.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
    
    const allFound = verification.every(v => v.status === 'found')
    
    return NextResponse.json({
      success: true,
      message: 'Demo users processing complete',
      results,
      verification,
      summary: {
        total_processed: DEMO_USERS.length,
        created: results.filter(r => r.action === 'created').length,
        updated: results.filter(r => r.action === 'updated').length,
        errors: results.filter(r => r.action === 'error').length,
        all_verified: allFound,
      },
      timestamp: new Date().toISOString(),
    })
    
  } catch (error) {
    console.error('❌ Error creating demo users:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to create demo users',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
