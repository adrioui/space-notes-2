#!/usr/bin/env tsx

/**
 * Demo Data Management Script
 * 
 * Provides commands to seed, cleanup, and reset demo data for testing.
 */

import { seedDemoData } from './seed-demo-data'
import { cleanupDemoData } from './cleanup-demo-data'

async function main() {
  const command = process.argv[2]

  switch (command) {
    case 'seed':
      console.log('🌱 Seeding demo data...')
      await seedDemoData()
      break

    case 'cleanup':
      console.log('🧹 Cleaning up demo data...')
      await cleanupDemoData()
      break

    case 'reset':
      console.log('🔄 Resetting demo data (cleanup + seed)...')
      await cleanupDemoData()
      console.log('\n⏳ Waiting 2 seconds before seeding...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      await seedDemoData()
      break

    case 'help':
    case '--help':
    case '-h':
      printHelp()
      break

    default:
      console.error('❌ Unknown command:', command)
      printHelp()
      process.exit(1)
  }
}

function printHelp() {
  console.log(`
🎭 Demo Data Management

Usage: npm run demo:data <command>

Commands:
  seed     - Create demo user accounts and sample data
  cleanup  - Remove all demo data from database
  reset    - Clean up existing demo data and create fresh data
  help     - Show this help message

Demo Accounts:
  📧 demo-admin@example.com  (Admin/Organizer)
  📧 demo-member@example.com (Member/Participant)
  🔑 OTP Code: 123456 (for both accounts in development)

Features Included:
  🏠 2 demo spaces with different themes
  💬 Sample messages and reactions
  📝 Published and draft notes
  🎓 Lessons with progress tracking
  👥 Space memberships and roles
  📎 File attachment examples

Examples:
  npm run demo:data seed     # Create demo data
  npm run demo:data cleanup  # Remove demo data
  npm run demo:data reset    # Fresh start with new demo data
`)
}

// ES Module equivalent of require.main === module
import { fileURLToPath } from 'url'

const isMainModule = fileURLToPath(import.meta.url) === process.argv[1]

if (isMainModule) {
  main()
    .then(() => {
      console.log('✅ Demo data management completed!')
    })
    .catch((error) => {
      console.error('💥 Demo data management failed:', error)
      process.exit(1)
    })
}
