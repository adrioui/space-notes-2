import { createClient } from '@supabase/supabase-js'
import { validateSupabaseConfig, logValidationResults } from './env-validation'

// Validate Supabase configuration
const validation = validateSupabaseConfig()
logValidationResults(validation, 'Supabase Client Configuration')

if (!validation.isValid || !validation.config) {
  throw new Error(`Invalid Supabase configuration: ${validation.errors.join(', ')}`)
}

const { url: supabaseUrl, anonKey: supabaseAnonKey } = validation.config

// Vercel-optimized Supabase client configuration
const isVercel = process.env.VERCEL === '1'
const isDevelopment = process.env.NODE_ENV === 'development'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We'll use NextAuth for session management
    autoRefreshToken: false, // NextAuth handles token refresh
    detectSessionInUrl: false, // Disable URL session detection
  },
  realtime: {
    params: {
      eventsPerSecond: isVercel ? 5 : 10, // Lower rate limit for Vercel
      // Add connection timeout and retry settings
      timeout: 30000, // 30 second timeout
      heartbeatIntervalMs: 30000, // 30 second heartbeat
    },
    // Add retry configuration
    reconnectAfterMs: (tries: number) => {
      // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
      return Math.min(1000 * Math.pow(2, tries), 30000)
    },
  },
  global: {
    headers: {
      'x-application-name': isVercel ? 'vercel-deployment' : 'local-development',
      // Add user agent for better debugging
      'user-agent': `space-notes-app/${isDevelopment ? 'dev' : 'prod'}`,
    },
  },
  // Optimize for Vercel serverless functions
  db: {
    schema: 'public',
  },
})

// Export types for TypeScript
export type Database = any // Will be updated with generated types later
