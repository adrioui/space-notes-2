import type { NextAuthOptions } from 'next-auth'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from './db'
import { users } from '@shared/schema'
import { eq, or } from 'drizzle-orm'
import { otpService } from './otp-service'

export async function findUserByContact(contact: string) {
  const isEmail = contact.includes('@')

  if (isEmail) {
    const result = await db.select().from(users).where(eq(users.email, contact)).limit(1)
    return result[0] || null
  } else {
    const result = await db.select().from(users).where(eq(users.phone, contact)).limit(1)
    return result[0] || null
  }
}

export async function createUserFromContact(contact: string, profileData?: Partial<typeof users.$inferInsert>) {
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
}

async function findOrCreateUser(contact: string) {
  const existingUser = await findUserByContact(contact)

  if (existingUser) {
    return existingUser
  }

  return await createUserFromContact(contact)
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
  },
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
  },
}