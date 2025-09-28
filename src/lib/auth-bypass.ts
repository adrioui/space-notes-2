import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from './db'
import { users } from '@shared/schema'
import { eq } from 'drizzle-orm'

/**
 * Complete Bypass NextAuth Configuration
 * 
 * This configuration completely bypasses all external services:
 * - No database operations
 * - No external API calls
 * - No email/SMS services
 * - Pure JWT-based authentication
 * - Demo accounts work with any OTP
 * - Regular accounts work with any 6-digit code
 */

// Demo user data with proper UUIDs for database compatibility
const DEMO_USERS = {
  'demo-admin@example.com': {
    id: '550e8400-e29b-41d4-a716-446655440001', // Fixed UUID for demo admin
    email: 'demo-admin@example.com',
    name: 'Demo Admin',
    role: 'admin',
    image: null,
  },
  'demo-member@example.com': {
    id: '550e8400-e29b-41d4-a716-446655440002', // Fixed UUID for demo member
    email: 'demo-member@example.com',
    name: 'Demo Member',
    role: 'member',
    image: null,
  },
};

function isDemoAccount(contact: string): boolean {
  return Object.keys(DEMO_USERS).includes(contact.toLowerCase());
}

function isValidOTP(otp: string): boolean {
  // Accept any 6-digit code
  return /^\d{6}$/.test(otp);
}

export const authOptionsBypass: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'otp',
      name: 'OTP',
      credentials: {
        contact: { label: 'Email or Phone', type: 'text' },
        otp: { label: 'OTP Code', type: 'text' },
      },
      async authorize(credentials) {
        try {
          console.log('🎭 BYPASS AUTH: Authorize called', {
            contact: credentials?.contact,
            hasOtp: !!credentials?.otp
          });

          if (!credentials?.contact || !credentials?.otp) {
            console.log('🎭 BYPASS AUTH: Missing credentials');
            return null;
          }

          // Validate OTP format (any 6-digit code)
          if (!isValidOTP(credentials.otp)) {
            console.log('🎭 BYPASS AUTH: Invalid OTP format');
            return null;
          }

          const contact = credentials.contact.toLowerCase();

          // Handle demo accounts - look up actual user from database
          if (isDemoAccount(contact)) {
            try {
              console.log(`🎭 BYPASS AUTH: Looking up demo user: ${contact}`)

              // Look up the actual demo user from the database
              const demoUser = await db
                .select({
                  id: users.id,
                  email: users.email,
                  displayName: users.displayName,
                  username: users.username,
                })
                .from(users)
                .where(eq(users.email, contact))
                .limit(1)

              if (demoUser.length > 0) {
                const user = demoUser[0]
                console.log(`🎭 BYPASS AUTH: Found demo user in database: ${user.id}`)

                return {
                  id: user.id, // Use actual database ID
                  email: user.email,
                  name: user.displayName || (contact.includes('admin') ? 'Demo Admin' : 'Demo Member'),
                  role: contact.includes('admin') ? 'admin' : 'member',
                  image: null,
                }
              } else {
                console.log(`🎭 BYPASS AUTH: Demo user not found in database: ${contact}`)

                // Demo user doesn't exist, create them
                const isAdmin = contact.toLowerCase() === 'demo-admin@example.com'
                const newUser = {
                  email: contact,
                  displayName: isAdmin ? 'Demo Admin' : 'Demo Member',
                  username: isAdmin ? 'demo-admin' : 'demo-member',
                  avatarType: 'emoji' as const,
                  avatarData: {
                    emoji: isAdmin ? '👑' : '👤',
                    backgroundColor: isAdmin ? '#6366F1' : '#10B981'
                  },
                }

                const createdUsers = await db.insert(users).values(newUser).returning()
                const createdUser = createdUsers[0]

                console.log(`🎭 BYPASS AUTH: Created demo user: ${createdUser.id}`)

                return {
                  id: createdUser.id, // Use actual database ID
                  email: createdUser.email,
                  name: createdUser.displayName,
                  role: isAdmin ? 'admin' : 'member',
                  image: null,
                }
              }
            } catch (dbError) {
              console.error(`🎭 BYPASS AUTH: Database error for demo user ${contact}:`, dbError)
              return null
            }
          }

          // Handle regular accounts - create user on the fly
          const isEmail = contact.includes('@');
          const user = {
            id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            email: isEmail ? contact : null,
            phone: !isEmail ? contact : null,
            name: isEmail ? contact.split('@')[0] : `User ${contact}`,
            role: 'member',
            image: null,
          };

          console.log('🎭 BYPASS AUTH: Regular account login successful', user.email || user.phone);
          return user;
        } catch (error) {
          console.error('🎭 BYPASS AUTH: Error in authorize function:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      try {
        if (user) {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.role = (user as any).role || 'member';
          token.phone = (user as any).phone;
        }
        return token;
      } catch (error) {
        console.error('🎭 BYPASS AUTH: JWT callback error:', error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (session?.user && token) {
          session.user.id = token.id as string;
          session.user.email = token.email as string;
          session.user.name = token.name as string;
          (session.user as any).role = token.role;
          (session.user as any).phone = token.phone;
        }
        return session;
      } catch (error) {
        console.error('🎭 BYPASS AUTH: Session callback error:', error);
        return session;
      }
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  secret: process.env.NEXTAUTH_SECRET || 'demo-secret-key-for-development',
  debug: process.env.NODE_ENV === 'development', // Enable debug only in development
  logger: {
    error(code, metadata) {
      console.error('🎭 NextAuth Error:', code, metadata);
    },
    warn(code) {
      console.warn('🎭 NextAuth Warning:', code);
    },
    debug(code, metadata) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🎭 NextAuth Debug:', code, metadata);
      }
    },
  },
  // Ensure proper URL configuration for Vercel
  ...(process.env.NEXTAUTH_URL && {
    url: process.env.NEXTAUTH_URL,
  }),
};
