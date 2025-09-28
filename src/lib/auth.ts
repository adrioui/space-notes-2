import type { NextAuthOptions } from 'next-auth'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from './db'
import { users } from '@shared/schema'
import { eq, or } from 'drizzle-orm'
import { otpService } from './otp-service'
import { getNextAuthConfig, logAuthConfig } from './auth-config'

// Log configuration on import (helps with debugging)
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  logAuthConfig()
}

export async function findUserByContact(contact: string) {
  try {
    const isEmail = contact.includes('@')

    if (isEmail) {
      const result = await db.select().from(users).where(eq(users.email, contact)).limit(1)
      return result[0] || null
    } else {
      const result = await db.select().from(users).where(eq(users.phone, contact)).limit(1)
      return result[0] || null
    }
  } catch (error) {
    console.error('Database error in findUserByContact:', error)
    // In serverless environments, database errors should not crash the auth flow
    return null
  }
}

export async function createUserFromContact(contact: string, profileData?: Partial<typeof users.$inferInsert>) {
  try {
    const isEmail = contact.includes('@')

    const userData = {
      email: isEmail ? contact : null,
      phone: !isEmail ? contact : null,
      displayName: profileData?.displayName || (isEmail ? contact.split('@')[0] : contact),
      username: profileData?.username || (isEmail ? contact.split('@')[0] + '_' + Date.now() : 'user_' + Date.now()),
      avatarType: (profileData?.avatarType as any) || 'emoji' as const,
      avatarData: profileData?.avatarData || { emoji: '👤', backgroundColor: '#6B73FF' },
      ...profileData,
    }

    const newUsers = await db.insert(users).values(userData).returning()
    return newUsers[0]
  } catch (error) {
    console.error('Database error in createUserFromContact:', error)
    throw new Error('Failed to create user account')
  }
}

async function findOrCreateUser(contact: string) {
  const existingUser = await findUserByContact(contact)

  if (existingUser) {
    return existingUser
  }

  return await createUserFromContact(contact)
}

// Get configuration for current environment
const authConfig = getNextAuthConfig()

export const authOptions: NextAuthOptions = {
  // Use JWT strategy for better Vercel compatibility
  // Database adapter can cause issues with serverless functions
  ...(authConfig.isServerless ? {} : { adapter: DrizzleAdapter(db) }),
  providers: [
    CredentialsProvider({
      id: 'otp',
      name: 'OTP',
      credentials: {
        contact: { label: 'Email or Phone', type: 'text' },
        otp: { label: 'OTP Code', type: 'text' },
        action: { label: 'Action', type: 'text' }, // 'verify' or 'complete-profile'
        profileData: { label: 'Profile Data', type: 'text' }, // JSON string for profile completion
      },
      async authorize(credentials) {
        if (!credentials?.contact || !credentials?.otp) {
          return null
        }

        // Verify OTP first
        const result = otpService.verifyOTP(credentials.contact, credentials.otp)

        if (!result.success) {
          throw new Error(result.message)
        }

        const action = credentials.action || 'verify'

        try {
          if (action === 'complete-profile') {
            // Handle profile completion for new users
            const profileData = credentials.profileData ? JSON.parse(credentials.profileData) : {}
            const user = await createUserFromContact(credentials.contact, profileData)

            return {
              id: user.id,
              email: user.email || null,
              name: user.displayName,
              image: null,
            }
          } else {
            // Handle existing user login
            const existingUser = await findUserByContact(credentials.contact)

            if (!existingUser) {
              // User doesn't exist, signal that profile completion is needed
              throw new Error('PROFILE_INCOMPLETE')
            }

            return {
              id: existingUser.id,
              email: existingUser.email || null,
              name: existingUser.displayName,
              image: null,
            }
          }
        } catch (error) {
          console.error('Error in OTP authorization:', error)
          if (error instanceof Error && error.message === 'PROFILE_INCOMPLETE') {
            throw error // Re-throw to be handled by client
          }
          throw new Error('Failed to authenticate user')
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: authConfig.secret,
  debug: authConfig.debug,
  // Ensure proper URL configuration for Vercel
  ...(authConfig.baseUrl && {
    url: authConfig.baseUrl,
    // Add redirect and callback URLs for better Vercel compatibility
    redirectProxyUrl: authConfig.baseUrl,
  }),
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session: async ({ session, token }) => {
      if (session?.user && token) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: '/',
    error: '/', // Redirect errors to home page
  },
  events: {
    async signIn(message) {
      console.log('NextAuth signIn event:', message.user?.email || message.user?.id)
    },
    async signOut(message) {
      console.log('NextAuth signOut event:', message.session?.user?.email || 'unknown')
    },
  },
  logger: {
    error(code, metadata) {
      console.error('NextAuth Error:', code, metadata)
    },
    warn(code) {
      console.warn('NextAuth Warning:', code)
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.log('NextAuth Debug:', code, metadata)
      }
    },
  },
}