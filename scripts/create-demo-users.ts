/**
 * Script to create demo users in the database with proper UUIDs
 * This ensures demo accounts work correctly with the database schema
 */

import { db } from '../src/lib/db'
import { users } from '../shared/schema'
import { eq } from 'drizzle-orm'

// Ensure we can run this script directly
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // Load environment variables for local development
  try {
    require('dotenv').config()
  } catch (e) {
    console.log('dotenv not available, using existing env vars')
  }
}

const DEMO_USERS = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'demo-admin@example.com',
    displayName: 'Demo Admin',
    username: 'demo-admin',
    avatarType: 'emoji',
    avatarData: { emoji: '👑', backgroundColor: '#6366F1' },
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'demo-member@example.com',
    displayName: 'Demo Member',
    username: 'demo-member',
    avatarType: 'emoji',
    avatarData: { emoji: '👤', backgroundColor: '#10B981' },
  },
]

async function createDemoUsers() {
  console.log('🎭 Creating demo users in database...')
  
  try {
    for (const demoUser of DEMO_USERS) {
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
        
        console.log(`🔄 Updated demo user ${demoUser.email}`)
      } else {
        // Create new user
        await db.insert(users).values(demoUser)
        console.log(`✨ Created demo user ${demoUser.email}`)
      }
    }
    
    console.log('🎉 Demo users setup complete!')
    
    // Verify users exist
    console.log('\n📋 Verifying demo users:')
    for (const demoUser of DEMO_USERS) {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, demoUser.id))
        .limit(1)
      
      if (user.length > 0) {
        console.log(`✅ ${user[0].email} (ID: ${user[0].id})`)
      } else {
        console.log(`❌ ${demoUser.email} not found`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error creating demo users:', error)
    throw error
  }
}

// Run the script
if (require.main === module) {
  createDemoUsers()
    .then(() => {
      console.log('✅ Demo users script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Demo users script failed:', error)
      process.exit(1)
    })
}

export { createDemoUsers }
