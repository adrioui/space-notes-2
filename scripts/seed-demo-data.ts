#!/usr/bin/env tsx

/**
 * Demo Data Seeding Script
 * 
 * Creates comprehensive demo user accounts with pre-populated data
 * to enable thorough testing of all Spaces collaborative platform features.
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
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
import dotenv from "dotenv"
import { fileURLToPath } from 'url'
import path from 'path'

dotenv.config()

// ES module equivalent of require.main === module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Database connection
const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('SUPABASE_DATABASE_URL or DATABASE_URL must be set')
}

const client = postgres(databaseUrl)
const db = drizzle(client)

// Demo user data
const demoUsers = [
  {
    email: 'demo-admin@example.com',
    displayName: 'Alex Demo (Admin)',
    username: 'alexdemo',
    avatarType: 'emoji',
    avatarData: { emoji: '👨‍💼', backgroundColor: '#3B82F6' },
    role: 'admin'
  },
  {
    email: 'demo-member@example.com',
    displayName: 'Sam Demo (Member)',
    username: 'samdemo',
    avatarType: 'emoji',
    avatarData: { emoji: '👩‍🎓', backgroundColor: '#10B981' },
    role: 'member'
  }
]

// Demo spaces data
const demoSpaces = [
  {
    name: 'Product Development Hub',
    description: 'Collaborative space for product development discussions, planning, and knowledge sharing.',
    emoji: '🚀',
    wallpaper: 'growth',
    inviteCode: 'PROD2024'
  },
  {
    name: 'Learning & Development',
    description: 'Educational content, tutorials, and skill development resources for the team.',
    emoji: '📚',
    wallpaper: 'neutral',
    inviteCode: 'LEARN24'
  }
]

// Sample lesson topics for realistic content
const sampleLessonTopics = [
  {
    id: '1',
    title: 'Introduction to Product Strategy',
    content: 'Understanding market needs and defining product vision.',
    type: 'text',
    completed: false
  },
  {
    id: '2',
    title: 'User Research Methods',
    content: 'Learn about surveys, interviews, and usability testing.',
    type: 'text',
    completed: false
  },
  {
    id: '3',
    title: 'Agile Development Principles',
    content: 'Core concepts of agile methodology and sprint planning.',
    type: 'text',
    completed: false
  }
]

// Sample note blocks for realistic content
const sampleNoteBlocks = [
  {
    id: '1',
    type: 'heading',
    content: 'Meeting Notes - Product Planning Session'
  },
  {
    id: '2',
    type: 'paragraph',
    content: 'Today we discussed the upcoming product roadmap and identified key priorities for Q1.'
  },
  {
    id: '3',
    type: 'bullet-list',
    content: [
      'Implement user authentication system',
      'Design new dashboard interface',
      'Conduct user testing sessions',
      'Optimize performance metrics'
    ]
  },
  {
    id: '4',
    type: 'paragraph',
    content: 'Next steps: Schedule follow-up meeting for next week to review progress.'
  }
]

async function seedDemoData() {
  console.log('🌱 Starting demo data seeding...')

  try {
    // 1. Create demo users
    console.log('👥 Creating demo users...')
    const createdUsers = await db.insert(users).values(demoUsers).returning()
    const [adminUser, memberUser] = createdUsers
    
    console.log(`✅ Created admin user: ${adminUser.email} (ID: ${adminUser.id})`)
    console.log(`✅ Created member user: ${memberUser.email} (ID: ${memberUser.id})`)

    // 2. Create demo spaces
    console.log('🏠 Creating demo spaces...')
    const spacesWithCreator = demoSpaces.map(space => ({
      ...space,
      createdBy: adminUser.id
    }))
    
    const createdSpaces = await db.insert(spaces).values(spacesWithCreator).returning()
    const [productSpace, learningSpace] = createdSpaces
    
    console.log(`✅ Created space: ${productSpace.name} (ID: ${productSpace.id})`)
    console.log(`✅ Created space: ${learningSpace.name} (ID: ${learningSpace.id})`)

    // 3. Add space memberships
    console.log('👥 Adding space memberships...')
    const memberships = [
      // Admin user as organizer in both spaces
      { spaceId: productSpace.id, userId: adminUser.id, role: 'admin', notificationLevel: 'all' },
      { spaceId: learningSpace.id, userId: adminUser.id, role: 'admin', notificationLevel: 'all' },
      // Member user as member in both spaces
      { spaceId: productSpace.id, userId: memberUser.id, role: 'member', notificationLevel: 'highlights' },
      { spaceId: learningSpace.id, userId: memberUser.id, role: 'member', notificationLevel: 'all' }
    ]
    
    await db.insert(spaceMembers).values(memberships)
    console.log('✅ Added space memberships')

    // 4. Create sample messages
    console.log('💬 Creating sample messages...')
    const sampleMessages = [
      // Product Space Messages
      {
        spaceId: productSpace.id,
        userId: adminUser.id,
        content: 'Welcome to the Product Development Hub! 🚀 This is where we collaborate on product strategy and development.',
        messageType: 'text'
      },
      {
        spaceId: productSpace.id,
        userId: memberUser.id,
        content: 'Thanks for setting this up! Looking forward to collaborating here.',
        messageType: 'text'
      },
      {
        spaceId: productSpace.id,
        userId: adminUser.id,
        content: 'I\'ve uploaded the latest product requirements document. Please review and share your feedback.',
        messageType: 'text',
        attachments: [
          { type: 'document', name: 'Product_Requirements_v2.pdf', url: '/demo/files/product-requirements.pdf' }
        ]
      },
      {
        spaceId: productSpace.id,
        userId: memberUser.id,
        content: 'Great! I\'ll review it today and get back with questions.',
        messageType: 'text'
      },
      // Learning Space Messages
      {
        spaceId: learningSpace.id,
        userId: adminUser.id,
        content: 'Welcome to our Learning & Development space! 📚 Here we share educational content and track our learning progress.',
        messageType: 'text'
      },
      {
        spaceId: learningSpace.id,
        userId: memberUser.id,
        content: 'This is perfect! I\'ve been looking for a structured way to track my learning goals.',
        messageType: 'text'
      },
      {
        spaceId: learningSpace.id,
        userId: adminUser.id,
        content: 'I\'ve created our first lesson series on Product Strategy. Check it out when you have time!',
        messageType: 'text'
      }
    ]
    
    const createdMessages = await db.insert(messages).values(sampleMessages).returning()
    console.log(`✅ Created ${createdMessages.length} sample messages`)

    // 5. Add message reactions
    console.log('👍 Adding message reactions...')
    const reactions = [
      { messageId: createdMessages[0].id, userId: memberUser.id, emoji: '🎉' },
      { messageId: createdMessages[1].id, userId: adminUser.id, emoji: '👍' },
      { messageId: createdMessages[2].id, userId: memberUser.id, emoji: '📄' },
      { messageId: createdMessages[4].id, userId: memberUser.id, emoji: '📚' },
      { messageId: createdMessages[5].id, userId: adminUser.id, emoji: '💯' },
      { messageId: createdMessages[6].id, userId: memberUser.id, emoji: '🚀' }
    ]
    
    await db.insert(messageReactions).values(reactions)
    console.log(`✅ Added ${reactions.length} message reactions`)

    // 6. Create sample notes
    console.log('📝 Creating sample notes...')
    const sampleNotes = [
      // Published note in Product Space
      {
        spaceId: productSpace.id,
        authorId: adminUser.id,
        title: 'Product Roadmap Q1 2024',
        blocks: [
          { id: '1', type: 'heading', content: 'Product Roadmap Q1 2024' },
          { id: '2', type: 'paragraph', content: 'Our strategic priorities for the first quarter of 2024.' },
          { id: '3', type: 'bullet-list', content: [
            'Launch user authentication system',
            'Implement real-time collaboration features',
            'Optimize application performance',
            'Conduct comprehensive user testing'
          ]},
          { id: '4', type: 'paragraph', content: 'Timeline: January - March 2024' }
        ],
        status: 'published',
        publishedAt: new Date()
      },
      // Draft note in Product Space
      {
        spaceId: productSpace.id,
        authorId: memberUser.id,
        title: 'User Feedback Analysis - Draft',
        blocks: [
          { id: '1', type: 'heading', content: 'User Feedback Analysis' },
          { id: '2', type: 'paragraph', content: 'Preliminary analysis of user feedback from recent surveys.' },
          { id: '3', type: 'paragraph', content: 'Key findings: Users want better collaboration tools and improved performance.' },
          { id: '4', type: 'paragraph', content: '[Work in progress - more analysis needed]' }
        ],
        status: 'draft'
      },
      // Published note in Learning Space
      {
        spaceId: learningSpace.id,
        authorId: adminUser.id,
        title: 'Learning Resources & Best Practices',
        blocks: [
          { id: '1', type: 'heading', content: 'Learning Resources & Best Practices' },
          { id: '2', type: 'paragraph', content: 'Curated list of learning resources for product development.' },
          { id: '3', type: 'bullet-list', content: [
            'Product Management courses on Coursera',
            'UX Design fundamentals',
            'Agile development methodologies',
            'Data analysis and metrics'
          ]},
          { id: '4', type: 'paragraph', content: 'Remember to track your progress and share insights with the team!' }
        ],
        status: 'published',
        publishedAt: new Date()
      }
    ]
    
    const createdNotes = await db.insert(notes).values(sampleNotes).returning()
    console.log(`✅ Created ${createdNotes.length} sample notes`)

    // 7. Create sample lessons
    console.log('🎓 Creating sample lessons...')
    const sampleLessons = [
      // Product Strategy Lesson Series
      {
        spaceId: learningSpace.id,
        authorId: adminUser.id,
        title: 'Introduction to Product Strategy',
        description: 'Learn the fundamentals of product strategy and market analysis.',
        topics: [
          {
            id: '1',
            type: 'text',
            title: 'What is Product Strategy?',
            content: 'Product strategy is the high-level plan that defines what a business wants to achieve with its product and how it plans to do so.',
            completed: false
          },
          {
            id: '2',
            type: 'text',
            title: 'Market Analysis',
            content: 'Understanding your target market, competitors, and customer needs is crucial for developing an effective product strategy.',
            completed: false
          },
          {
            id: '3',
            type: 'text',
            title: 'Setting Product Goals',
            content: 'Define clear, measurable goals that align with your business objectives and customer value.',
            completed: false
          }
        ],
        status: 'published',
        publishedAt: new Date()
      },
      {
        spaceId: learningSpace.id,
        authorId: adminUser.id,
        title: 'User Research Fundamentals',
        description: 'Master the art of understanding your users through research methods.',
        topics: [
          {
            id: '1',
            type: 'text',
            title: 'Why User Research Matters',
            content: 'User research helps you understand your users\' needs, behaviors, and pain points to build better products.',
            completed: false
          },
          {
            id: '2',
            type: 'text',
            title: 'Research Methods',
            content: 'Learn about surveys, interviews, usability testing, and analytics to gather user insights.',
            completed: false
          },
          {
            id: '3',
            type: 'text',
            title: 'Analyzing Research Data',
            content: 'Turn research findings into actionable insights for product development.',
            completed: false
          }
        ],
        status: 'published',
        publishedAt: new Date()
      },
      {
        spaceId: productSpace.id,
        authorId: adminUser.id,
        title: 'Agile Development Best Practices',
        description: 'Learn agile methodologies for efficient product development.',
        topics: [
          {
            id: '1',
            type: 'text',
            title: 'Agile Principles',
            content: 'Understand the core principles of agile development and how they improve team productivity.',
            completed: false
          },
          {
            id: '2',
            type: 'text',
            title: 'Sprint Planning',
            content: 'Learn how to plan effective sprints and manage development cycles.',
            completed: false
          }
        ],
        status: 'draft'
      }
    ]

    const createdLessons = await db.insert(lessons).values(sampleLessons).returning()
    console.log(`✅ Created ${createdLessons.length} sample lessons`)

    // 8. Add lesson progress for member user
    console.log('📈 Adding lesson progress...')
    const progressData = [
      // Member user has completed first two topics of first lesson
      {
        lessonId: createdLessons[0].id,
        userId: memberUser.id,
        topicIndex: 0, // First topic
        completed: true,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        lessonId: createdLessons[0].id,
        userId: memberUser.id,
        topicIndex: 1, // Second topic
        completed: true,
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        lessonId: createdLessons[0].id,
        userId: memberUser.id,
        topicIndex: 2, // Third topic
        completed: false // Not completed yet
      },
      // Member user has completed first topic of second lesson
      {
        lessonId: createdLessons[1].id,
        userId: memberUser.id,
        topicIndex: 0, // First topic
        completed: true,
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        lessonId: createdLessons[1].id,
        userId: memberUser.id,
        topicIndex: 1, // Second topic
        completed: false // Not completed yet
      },
      {
        lessonId: createdLessons[1].id,
        userId: memberUser.id,
        topicIndex: 2, // Third topic
        completed: false // Not completed yet
      }
    ]

    await db.insert(lessonProgress).values(progressData)
    console.log(`✅ Added lesson progress for ${progressData.length} topic records`)

    console.log('\n🎉 Demo data seeding completed successfully!')
    console.log('\n📋 Summary of created demo data:')
    console.log(`👥 Users: ${createdUsers.length}`)
    console.log(`🏠 Spaces: ${createdSpaces.length}`)
    console.log(`💬 Messages: ${createdMessages.length}`)
    console.log(`📝 Notes: ${createdNotes.length}`)
    console.log(`🎓 Lessons: ${createdLessons.length}`)
    console.log(`📈 Progress Records: ${progressData.length}`)

    console.log('\n🔑 Demo Account Credentials:')
    console.log('Admin Account: demo-admin@example.com')
    console.log('Member Account: demo-member@example.com')
    console.log('Note: Use OTP authentication with these emails')

    return {
      adminUser,
      memberUser,
      productSpace,
      learningSpace,
      createdMessages,
      createdNotes,
      createdLessons
    }

  } catch (error) {
    console.error('❌ Error seeding demo data:', error)
    throw error
  } finally {
    await client.end()
  }
}

// Export for use in other scripts
export { seedDemoData }

// ES Module equivalent of require.main === module
import { fileURLToPath } from 'url'

const isMainModule = fileURLToPath(import.meta.url) === process.argv[1]

if (isMainModule) {
  seedDemoData()
    .then(() => {
      console.log('🎉 Demo data seeding completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Demo data seeding failed:', error)
      process.exit(1)
    })
}
