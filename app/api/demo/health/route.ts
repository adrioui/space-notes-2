import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@shared/schema'
import { eq } from 'drizzle-orm'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const DEMO_USER_IDS = [
  '550e8400-e29b-41d4-a716-446655440001', // demo-admin
  '550e8400-e29b-41d4-a716-446655440002', // demo-member
]

export async function GET(request: NextRequest) {
  try {
    console.log('🎭 Checking demo users health...')
    
    const demoUsers = []
    const missingUsers = []
    
    for (const userId of DEMO_USER_IDS) {
      try {
        const user = await db
          .select({
            id: users.id,
            email: users.email,
            displayName: users.displayName,
            username: users.username,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1)
        
        if (user.length > 0) {
          demoUsers.push(user[0])
        } else {
          missingUsers.push(userId)
        }
      } catch (error) {
        console.error(`Error checking user ${userId}:`, error)
        missingUsers.push(userId)
      }
    }
    
    const isHealthy = missingUsers.length === 0
    
    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      demo_users: {
        found: demoUsers.length,
        missing: missingUsers.length,
        total_expected: DEMO_USER_IDS.length,
      },
      users: demoUsers,
      missing_user_ids: missingUsers,
      database: {
        connected: true,
        uuid_format: 'valid',
      }
    }, { 
      status: isHealthy ? 200 : 500 
    })
    
  } catch (error) {
    console.error('Demo health check error:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          error: error instanceof Error ? error.message : 'Database connection failed',
        }
      },
      { status: 500 }
    )
  }
}
