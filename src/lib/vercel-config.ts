/**
 * Vercel-specific configuration and optimizations
 */

// Vercel serverless function configuration
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: '8mb',
  },
  // Optimize for Vercel Edge Runtime where possible
  runtime: 'nodejs18.x',
  maxDuration: 30, // seconds
}

// Database connection optimization for Vercel
export const getVercelOptimizedDbConfig = () => {
  const isVercel = process.env.VERCEL === '1'
  
  if (isVercel) {
    return {
      // Optimize connection pooling for serverless
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 1, // Single connection per serverless function
    }
  }
  
  return {
    // Local development settings
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 60000,
    max: 10,
  }
}

// Environment detection
export const isVercelEnvironment = () => {
  return process.env.VERCEL === '1'
}

export const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Browser should use relative URL
    return ''
  }
  
  if (process.env.VERCEL_URL) {
    // Vercel deployment
    return `https://${process.env.VERCEL_URL}`
  }
  
  if (process.env.NEXTAUTH_URL) {
    // Custom domain or local development
    return process.env.NEXTAUTH_URL
  }
  
  // Fallback
  return 'http://localhost:3000'
}

// Vercel-optimized error handling
export const handleVercelError = (error: unknown, context: string) => {
  console.error(`[Vercel Error - ${context}]:`, error)
  
  // In Vercel, we want to be more careful about error exposure
  if (isVercelEnvironment()) {
    return {
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
      context,
    }
  }
  
  // Development - show full error
  return {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    context,
  }
}
