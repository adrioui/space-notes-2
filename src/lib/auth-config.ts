/**
 * NextAuth.js configuration validation and utilities for Vercel deployment
 */

// Validate required environment variables for NextAuth
export function validateAuthEnvironment() {
  const errors: string[] = []
  
  // Required for NextAuth.js
  if (!process.env.NEXTAUTH_SECRET) {
    errors.push('NEXTAUTH_SECRET is required')
  }
  
  // Required for production
  if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_URL) {
    errors.push('NEXTAUTH_URL is required in production')
  }
  
  // Validate NEXTAUTH_URL format
  if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.startsWith('http')) {
    errors.push('NEXTAUTH_URL must be a valid URL starting with http:// or https://')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Get the correct base URL for NextAuth
export function getAuthBaseUrl(): string {
  // In production, use NEXTAUTH_URL
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL
  }
  
  // In Vercel, use VERCEL_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // Fallback for local development
  return 'http://localhost:3000'
}

// Check if we're in a serverless environment
export function isServerlessEnvironment(): boolean {
  return process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined
}

// Get NextAuth configuration for the current environment
export function getNextAuthConfig() {
  const validation = validateAuthEnvironment()
  
  if (!validation.valid) {
    console.error('NextAuth Environment Validation Failed:', validation.errors)
    // In development, log errors but continue
    // In production, this could cause issues
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`NextAuth configuration errors: ${validation.errors.join(', ')}`)
    }
  }
  
  return {
    baseUrl: getAuthBaseUrl(),
    isServerless: isServerlessEnvironment(),
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
  }
}

// Log NextAuth configuration (without sensitive data)
export function logAuthConfig() {
  const config = getNextAuthConfig()
  
  console.log('NextAuth Configuration:', {
    baseUrl: config.baseUrl,
    isServerless: config.isServerless,
    hasSecret: !!config.secret,
    debug: config.debug,
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL === '1',
  })
}
