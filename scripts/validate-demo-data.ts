#!/usr/bin/env tsx

/**
 * Demo Data Validation Script
 * 
 * Validates that demo data has been properly seeded and is ready for testing.
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
  console.error('❌ SUPABASE_DATABASE_URL or DATABASE_URL must be set')
  process.exit(1)
}

const client = postgres(databaseUrl)
const db = drizzle(client)

// Demo user emails for identification
const DEMO_EMAILS = ['demo-admin@example.com', 'demo-member@example.com']

interface ValidationResult {
  category: string
  expected: number
  actual: number
  passed: boolean
  details?: string[]
}

async function validateDemoData() {
  console.log('🔍 Validating demo data...')
  
  const results: ValidationResult[] = []

  try {
    // 1. Validate demo users
    console.log('👥 Checking demo users...')
    const demoUsers = await db
      .select()
      .from(users)
      .where(or(
        eq(users.email, DEMO_EMAILS[0]),
        eq(users.email, DEMO_EMAILS[1])
      ))

    const userDetails = demoUsers.map(u => `${u.displayName} (${u.email})`)
    results.push({
      category: 'Demo Users',
      expected: 2,
      actual: demoUsers.length,
      passed: demoUsers.length === 2,
      details: userDetails
    })

    if (demoUsers.length === 0) {
      console.log('❌ No demo users found. Run: npm run demo:seed')
      return results
    }

    const demoUserIds = demoUsers.map(user => user.id)

    // 2. Validate demo spaces
    console.log('🏠 Checking demo spaces...')
    const demoSpaces = await db
      .select()
      .from(spaces)
      .where(or(...demoUserIds.map(id => eq(spaces.createdBy, id))))

    const spaceDetails = demoSpaces.map(s => `${s.name} (${s.emoji})`)
    results.push({
      category: 'Demo Spaces',
      expected: 2,
      actual: demoSpaces.length,
      passed: demoSpaces.length === 2,
      details: spaceDetails
    })

    const demoSpaceIds = demoSpaces.map(space => space.id)

    // 3. Validate space memberships
    console.log('👥 Checking space memberships...')
    const memberships = await db
      .select()
      .from(spaceMembers)
      .where(or(...demoSpaceIds.map(id => eq(spaceMembers.spaceId, id))))

    results.push({
      category: 'Space Memberships',
      expected: 4, // 2 users × 2 spaces
      actual: memberships.length,
      passed: memberships.length === 4
    })

    // 4. Validate messages
    console.log('💬 Checking messages...')
    const demoMessages = await db
      .select()
      .from(messages)
      .where(or(...demoSpaceIds.map(id => eq(messages.spaceId, id))))

    results.push({
      category: 'Sample Messages',
      expected: 7,
      actual: demoMessages.length,
      passed: demoMessages.length >= 5 // Allow some flexibility
    })

    // 5. Validate message reactions
    console.log('👍 Checking message reactions...')
    const reactions = await db
      .select()
      .from(messageReactions)
      .where(or(...demoUserIds.map(id => eq(messageReactions.userId, id))))

    results.push({
      category: 'Message Reactions',
      expected: 6,
      actual: reactions.length,
      passed: reactions.length >= 4 // Allow some flexibility
    })

    // 6. Validate notes
    console.log('📝 Checking notes...')
    const demoNotes = await db
      .select()
      .from(notes)
      .where(or(...demoSpaceIds.map(id => eq(notes.spaceId, id))))

    const noteDetails = demoNotes.map(n => `${n.title} (${n.status})`)
    results.push({
      category: 'Sample Notes',
      expected: 3,
      actual: demoNotes.length,
      passed: demoNotes.length === 3,
      details: noteDetails
    })

    // 7. Validate lessons
    console.log('🎓 Checking lessons...')
    const demoLessons = await db
      .select()
      .from(lessons)
      .where(or(...demoSpaceIds.map(id => eq(lessons.spaceId, id))))

    const lessonDetails = demoLessons.map(l => `${l.title} (${l.status})`)
    results.push({
      category: 'Sample Lessons',
      expected: 3,
      actual: demoLessons.length,
      passed: demoLessons.length === 3,
      details: lessonDetails
    })

    // 8. Validate lesson progress
    console.log('📈 Checking lesson progress...')
    const progressRecords = await db
      .select()
      .from(lessonProgress)
      .where(or(...demoUserIds.map(id => eq(lessonProgress.userId, id))))

    results.push({
      category: 'Lesson Progress',
      expected: 2,
      actual: progressRecords.length,
      passed: progressRecords.length >= 1 // At least some progress
    })

    return results

  } catch (error) {
    console.error('❌ Error validating demo data:', error)
    throw error
  } finally {
    await client.end()
  }
}

function printResults(results: ValidationResult[]) {
  console.log('\n📊 Demo Data Validation Results:')
  console.log('=' .repeat(60))

  let allPassed = true
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌'
    const status = result.passed ? 'PASS' : 'FAIL'
    
    console.log(`${icon} ${result.category}: ${result.actual}/${result.expected} ${status}`)
    
    if (result.details && result.details.length > 0) {
      result.details.forEach(detail => {
        console.log(`    - ${detail}`)
      })
    }
    
    if (!result.passed) {
      allPassed = false
    }
  })

  console.log('\n' + '=' .repeat(60))
  
  if (allPassed) {
    console.log('🎉 All validation checks passed!')
    console.log('✅ Demo data is properly seeded and ready for testing')
    console.log('\n🔑 Demo Account Credentials:')
    console.log('   📧 demo-admin@example.com (OTP: 123456)')
    console.log('   📧 demo-member@example.com (OTP: 123456)')
  } else {
    console.log('⚠️  Some validation checks failed')
    console.log('💡 Try running: npm run demo:reset')
  }

  return allPassed
}

// Export for use in other scripts
export { validateDemoData }

// ES Module equivalent of require.main === module
import { fileURLToPath } from 'url'

const isMainModule = fileURLToPath(import.meta.url) === process.argv[1]

if (isMainModule) {
  validateDemoData()
    .then(results => {
      const success = printResults(results)
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('💥 Demo data validation failed:', error)
      process.exit(1)
    })
}
