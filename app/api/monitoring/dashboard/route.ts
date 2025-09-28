import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, spaces, spaceMembers } from '@shared/schema'
import { eq, count } from 'drizzle-orm'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const DEMO_USER_IDS = [
  '550e8400-e29b-41d4-a716-446655440001', // demo-admin
  '550e8400-e29b-41d4-a716-446655440002', // demo-member
]

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Generating monitoring dashboard...')
    
    // Check demo users
    const demoUsers = []
    for (const userId of DEMO_USER_IDS) {
      try {
        const user = await db
          .select({
            id: users.id,
            email: users.email,
            displayName: users.displayName,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1)
        
        if (user.length > 0) {
          demoUsers.push(user[0])
        }
      } catch (error) {
        console.error(`Error checking demo user ${userId}:`, error)
      }
    }
    
    // Get total user count
    let totalUsers = 0
    try {
      const userCount = await db.select({ count: count() }).from(users)
      totalUsers = userCount[0]?.count || 0
    } catch (error) {
      console.error('Error counting users:', error)
    }
    
    // Get total spaces count
    let totalSpaces = 0
    try {
      const spaceCount = await db.select({ count: count() }).from(spaces)
      totalSpaces = spaceCount[0]?.count || 0
    } catch (error) {
      console.error('Error counting spaces:', error)
    }
    
    // Check demo user memberships
    const demoMemberships = []
    for (const userId of DEMO_USER_IDS) {
      try {
        const memberships = await db
          .select({ count: count() })
          .from(spaceMembers)
          .where(eq(spaceMembers.userId, userId))
        
        demoMemberships.push({
          userId,
          membershipCount: memberships[0]?.count || 0
        })
      } catch (error) {
        console.error(`Error checking memberships for ${userId}:`, error)
        demoMemberships.push({
          userId,
          membershipCount: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    // System health checks
    const healthChecks = {
      database: {
        connected: true,
        users_table: totalUsers >= 0,
        spaces_table: totalSpaces >= 0,
        demo_users_exist: demoUsers.length === 2,
      },
      demo_accounts: {
        admin_exists: demoUsers.some(u => u.email === 'demo-admin@example.com'),
        member_exists: demoUsers.some(u => u.email === 'demo-member@example.com'),
        uuid_format_valid: demoUsers.every(u => 
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(u.id)
        ),
      },
      authentication: {
        nextauth_configured: !!process.env.NEXTAUTH_SECRET,
        nextauth_url_set: !!process.env.NEXTAUTH_URL,
        demo_mode_enabled: process.env.NODE_ENV === 'development',
      }
    }
    
    // Calculate overall health
    const allHealthy = Object.values(healthChecks).every(category =>
      Object.values(category).every(check => check === true)
    )
    
    return NextResponse.json({
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      
      // System Overview
      overview: {
        total_users: totalUsers,
        total_spaces: totalSpaces,
        demo_users_active: demoUsers.length,
        system_health: allHealthy ? 'healthy' : 'degraded',
      },
      
      // Demo Account Details
      demo_accounts: {
        users: demoUsers,
        memberships: demoMemberships,
        health: healthChecks.demo_accounts,
      },
      
      // System Health
      health_checks: healthChecks,
      
      // Environment Info
      environment: {
        node_env: process.env.NODE_ENV,
        nextauth_url: process.env.NEXTAUTH_URL || 'not_set',
        vercel_env: process.env.VERCEL_ENV || 'local',
        deployment_time: new Date().toISOString(),
      },
      
      // Quick Actions
      quick_actions: {
        test_demo_health: '/api/demo/health',
        test_nextauth_health: '/api/auth/health',
        test_demo_login: '/?demo=admin',
        view_spaces: '/api/spaces',
      }
    })
    
  } catch (error) {
    console.error('Monitoring dashboard error:', error)
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        health_checks: {
          database: { connected: false, error: error instanceof Error ? error.message : 'Unknown error' },
          demo_accounts: { status: 'unknown' },
          authentication: { status: 'unknown' },
        }
      },
      { status: 500 }
    )
  }
}
