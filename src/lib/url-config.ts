/**
 * URL configuration for different environments
 * Handles Vercel deployment URLs, custom domains, and local development
 */

export const getBaseUrl = (): string => {
  // Browser should use relative URL
  if (typeof window !== 'undefined') {
    return ''
  }

  // Vercel deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Custom domain or NEXTAUTH_URL
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL
  }

  // Fallback for local development
  return 'http://localhost:3000'
}

export const getApiUrl = (path: string): string => {
  const baseUrl = getBaseUrl()
  return `${baseUrl}/api${path.startsWith('/') ? path : `/${path}`}`
}

export const getAbsoluteUrl = (path: string): string => {
  const baseUrl = getBaseUrl()
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

// Environment detection helpers
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production'
}

export const isVercel = (): boolean => {
  return process.env.VERCEL === '1'
}

export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development'
}

// Get the current deployment environment
export const getEnvironment = (): 'development' | 'preview' | 'production' => {
  if (isDevelopment()) return 'development'
  if (process.env.VERCEL_ENV === 'preview') return 'preview'
  return 'production'
}

// Get the current domain
export const getCurrentDomain = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  return getBaseUrl()
}

// Validate URL configuration
export const validateUrlConfig = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (isProduction()) {
    if (!process.env.NEXTAUTH_URL) {
      errors.push('NEXTAUTH_URL is required in production')
    }
    
    if (!process.env.NEXT_PUBLIC_NEXTAUTH_URL) {
      errors.push('NEXT_PUBLIC_NEXTAUTH_URL is required in production')
    }
    
    if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.startsWith('https://')) {
      errors.push('NEXTAUTH_URL must use HTTPS in production')
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
