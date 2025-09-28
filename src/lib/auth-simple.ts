import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { otpService } from './otp-service-demo'

// Simplified NextAuth configuration for Vercel compatibility
export const authOptionsSimple: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'otp',
      name: 'OTP',
      credentials: {
        contact: { label: 'Email or Phone', type: 'text' },
        otp: { label: 'OTP Code', type: 'text' },
      },
      async authorize(credentials) {
        console.log('NextAuth authorize called with:', { 
          contact: credentials?.contact,
          hasOtp: !!credentials?.otp 
        })

        if (!credentials?.contact || !credentials?.otp) {
          console.log('Missing credentials')
          return null
        }

        try {
          // Verify OTP
          const result = otpService.verifyOTP(credentials.contact, credentials.otp)
          console.log('OTP verification result:', { success: result.success })

          if (!result.success) {
            console.log('OTP verification failed:', result.message)
            return null
          }

          // For demo accounts, return a simple user object
          const isDemoAccount = ['demo-admin@example.com', 'demo-member@example.com'].includes(credentials.contact.toLowerCase())
          
          if (isDemoAccount) {
            const isAdmin = credentials.contact.toLowerCase() === 'demo-admin@example.com'
            return {
              id: isAdmin ? 'demo-admin-id' : 'demo-member-id',
              email: credentials.contact,
              name: isAdmin ? 'Demo Admin' : 'Demo Member',
              image: null,
            }
          }

          // For non-demo accounts, create a basic user
          return {
            id: `user-${Date.now()}`,
            email: credentials.contact.includes('@') ? credentials.contact : null,
            name: credentials.contact.includes('@') ? credentials.contact.split('@')[0] : credentials.contact,
            image: null,
          }
        } catch (error) {
          console.error('Error in NextAuth authorize:', error)
          return null
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
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user && token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
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
