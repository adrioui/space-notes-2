import { createClient } from '@supabase/supabase-js'

// Supabase configuration - use environment variables directly
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We'll use NextAuth for session management
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Rate limiting for realtime events
    },
  },
})

// Export types for TypeScript
export type Database = any // Will be updated with generated types later