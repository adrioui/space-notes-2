#!/usr/bin/env tsx

/**
 * Demo Data Cleanup Script
 * 
 * Removes all demo data from the database to reset the testing environment.
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, or } from 'drizzle-orm'
import { 
  users, 
  spaces, 
  spaceMembers, 
  messages, 
  messageReactions, 
  notes, 
  lessons, 
  lessonProgress 
} from '../shared/schema'

import dotenv from 'dotenv'
dotenv.config()

// Database connection
const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('SUPABASE_DATABASE_URL or DATABASE_URL must be set')
}

const client = postgres(databaseUrl)
const db = drizzle(client)

// Demo user emails for identification
const DEMO_EMAILS = ['demo-admin@example.com', 'demo-member@example.com']

async function cleanupDemoData() {
  console.log('🧹 Starting demo data cleanup...')

  try {
    // 1. Find demo users
    console.log('🔍 Finding demo users...')
    const demoUsers = await db
      .select()
      .from(users)
      .where(or(
        eq(users.email, DEMO_EMAILS[0]),
        eq(users.email, DEMO_EMAILS[1])
      ))

    if (demoUsers.length === 0) {
      console.log('ℹ️  No demo users found. Nothing to clean up.')
      return
    }

    const demoUserIds = demoUsers.map(user => user.id)
    console.log(`📋 Found ${demoUsers.length} demo users: ${demoUsers.map(u => u.email).join(', ')}`)

    // 2. Find spaces created by demo users
    console.log('🔍 Finding demo spaces...')
    const demoSpaces = await db
      .select()
      .from(spaces)
      .where(or(...demoUserIds.map(id => eq(spaces.createdBy, id))))

    const demoSpaceIds = demoSpaces.map(space => space.id)
    console.log(`📋 Found ${demoSpaces.length} demo spaces: ${demoSpaces.map(s => s.name).join(', ')}`)

    // 3. Clean up lesson progress
    if (demoSpaceIds.length > 0) {
      console.log('📈 Cleaning up lesson progress...')
      const deletedProgress = await db
        .delete(lessonProgress)
        .where(or(...demoUserIds.map(id => eq(lessonProgress.userId, id))))
        .returning()
      console.log(`✅ Deleted ${deletedProgress.length} lesson progress records`)
    }

    // 4. Clean up lessons
    if (demoSpaceIds.length > 0) {
      console.log('🎓 Cleaning up lessons...')
      const deletedLessons = await db
        .delete(lessons)
        .where(or(...demoSpaceIds.map(id => eq(lessons.spaceId, id))))
        .returning()
      console.log(`✅ Deleted ${deletedLessons.length} lessons`)
    }

    // 5. Clean up notes
    if (demoSpaceIds.length > 0) {
      console.log('📝 Cleaning up notes...')
      const deletedNotes = await db
        .delete(notes)
        .where(or(...demoSpaceIds.map(id => eq(notes.spaceId, id))))
        .returning()
      console.log(`✅ Deleted ${deletedNotes.length} notes`)
    }

    // 6. Clean up message reactions
    if (demoSpaceIds.length > 0) {
      console.log('👍 Cleaning up message reactions...')
      const deletedReactions = await db
        .delete(messageReactions)
        .where(or(...demoUserIds.map(id => eq(messageReactions.userId, id))))
        .returning()
      console.log(`✅ Deleted ${deletedReactions.length} message reactions`)
    }

    // 7. Clean up messages
    if (demoSpaceIds.length > 0) {
      console.log('💬 Cleaning up messages...')
      const deletedMessages = await db
        .delete(messages)
        .where(or(...demoSpaceIds.map(id => eq(messages.spaceId, id))))
        .returning()
      console.log(`✅ Deleted ${deletedMessages.length} messages`)
    }

    // 8. Clean up space memberships
    if (demoSpaceIds.length > 0) {
      console.log('👥 Cleaning up space memberships...')
      const deletedMemberships = await db
        .delete(spaceMembers)
        .where(or(...demoSpaceIds.map(id => eq(spaceMembers.spaceId, id))))
        .returning()
      console.log(`✅ Deleted ${deletedMemberships.length} space memberships`)
    }

    // 9. Clean up spaces
    if (demoSpaceIds.length > 0) {
      console.log('🏠 Cleaning up spaces...')
      const deletedSpaces = await db
        .delete(spaces)
        .where(or(...demoSpaceIds.map(id => eq(spaces.id, id))))
        .returning()
      console.log(`✅ Deleted ${deletedSpaces.length} spaces`)
    }

    // 10. Clean up users (last, as they're referenced by other tables)
    console.log('👥 Cleaning up demo users...')
    const deletedUsers = await db
      .delete(users)
      .where(or(...demoUserIds.map(id => eq(users.id, id))))
      .returning()
    console.log(`✅ Deleted ${deletedUsers.length} demo users`)

    console.log('\n🎉 Demo data cleanup completed successfully!')
    console.log('The database is now clean and ready for fresh demo data.')

  } catch (error) {
    console.error('❌ Error cleaning up demo data:', error)
    throw error
  } finally {
    await client.end()
  }
}

// Export for use in other scripts
export { cleanupDemoData }

// ES Module equivalent of require.main === module
import { fileURLToPath } from 'url'

const isMainModule = fileURLToPath(import.meta.url) === process.argv[1]

if (isMainModule) {
  cleanupDemoData()
    .then(() => {
      console.log('✨ Demo data cleanup completed!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Demo data cleanup failed:', error)
      process.exit(1)
    })
}
