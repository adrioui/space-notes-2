import type { NextAuthOptions } from 'next-auth'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from './db'
import { users } from '@shared/schema'
import { eq, or } from 'drizzle-orm'
import { otpService } from './otp-service'

async function findOrCreateUser(contact: string) {
  const isEmail = contact.includes('@')
  
  // Try to find existing user
  let existingUser
  if (isEmail) {
    const result = await db.select().from(users).where(eq(users.email, contact)).limit(1)
    existingUser = result[0]
  } else {
    const result = await db.select().from(users).where(eq(users.phone, contact)).limit(1)
    existingUser = result[0]
  }

  if (existingUser) {
    return existingUser
  }

  // Create new user if not found
  const userData = {
    email: isEmail ? contact : null,
    phone: !isEmail ? contact : null,
    displayName: isEmail ? contact.split('@')[0] : contact,
    username: isEmail ? contact.split('@')[0] + '_' + Date.now() : 'user_' + Date.now(),
    avatarType: 'emoji' as const,
    avatarData: { emoji: '👤', backgroundColor: '#6B73FF' },
  }

  const newUsers = await db.insert(users).values(userData).returning()
  return newUsers[0]
}

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db),
  providers: [
    CredentialsProvider({
      id: 'otp',
      name: 'OTP',
      credentials: {
        contact: { label: 'Email or Phone', type: 'text' },
        otp: { label: 'OTP Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.contact || !credentials?.otp) {
          return null
        }

        // Verify OTP
        const result = otpService.verifyOTP(credentials.contact, credentials.otp)
        
        if (!result.success) {
          throw new Error(result.message)
        }

        // Find or create user
        try {
          const user = await findOrCreateUser(credentials.contact)
          
          return {
            id: user.id,
            email: user.email,
            name: user.displayName,
            image: null, // Will be handled by avatar system
          }
        } catch (error) {
          console.error('Error creating/finding user:', error)
          throw new Error('Failed to authenticate user')
        }
      },
    }),
  ],
  session: {
    strategy: 'database',
  },
  callbacks: {
    session: async ({ session, user }) => {
      if (session?.user && user) {
        session.user.id = user.id
      }
      return session
    },
  },
  pages: {
    signIn: '/',
  },
}