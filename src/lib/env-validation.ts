/**
 * Environment variable validation for Supabase configuration
 */

interface SupabaseConfig {
  url: string
  anonKey: string
  serviceKey?: string
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  config?: SupabaseConfig
}

/**
 * Validate Supabase environment variables
 */
export function validateSupabaseConfig(): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Validate URL
  if (!supabaseUrl) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
  } else {
    try {
      const url = new URL(supabaseUrl)
      if (!url.hostname.includes('supabase')) {
        warnings.push('SUPABASE_URL does not appear to be a Supabase URL')
      }
      if (url.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
        errors.push('SUPABASE_URL must use HTTPS in production')
      }
    } catch {
      errors.push('NEXT_PUBLIC_SUPABASE_URL is not a valid URL')
    }
  }

  // Validate anonymous key
  if (!supabaseAnonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  } else {
    if (supabaseAnonKey.length < 100) {
      warnings.push('SUPABASE_ANON_KEY appears to be too short')
    }
    if (!supabaseAnonKey.startsWith('eyJ')) {
      warnings.push('SUPABASE_ANON_KEY does not appear to be a valid JWT token')
    }
  }

  // Validate service key (optional but recommended for server operations)
  if (!supabaseServiceKey) {
    warnings.push('SUPABASE_SERVICE_ROLE_KEY is not set (required for server-side operations)')
  } else {
    if (supabaseServiceKey.length < 100) {
      warnings.push('SUPABASE_SERVICE_ROLE_KEY appears to be too short')
    }
    if (!supabaseServiceKey.startsWith('eyJ')) {
      warnings.push('SUPABASE_SERVICE_ROLE_KEY does not appear to be a valid JWT token')
    }
  }

  // Check for common configuration issues
  if (supabaseUrl && supabaseAnonKey) {
    // Check if URL and key match (basic validation)
    try {
      const urlParts = new URL(supabaseUrl)
      const projectId = urlParts.hostname.split('.')[0]
      
      // Decode JWT to check project reference (basic check)
      const payload = JSON.parse(atob(supabaseAnonKey.split('.')[1]))
      if (payload.iss && !payload.iss.includes(projectId)) {
        warnings.push('SUPABASE_URL and SUPABASE_ANON_KEY may not match the same project')
      }
    } catch {
      // Ignore JWT decode errors - just a basic check
    }
  }

  const isValid = errors.length === 0

  const result: ValidationResult = {
    isValid,
    errors,
    warnings,
  }

  if (isValid && supabaseUrl && supabaseAnonKey) {
    result.config = {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      serviceKey: supabaseServiceKey,
    }
  }

  return result
}

/**
 * Validate connection to Supabase
 */
export async function validateSupabaseConnection(config: SupabaseConfig): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Test basic connectivity
    const response = await fetch(`${config.url}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': config.anonKey,
        'Authorization': `Bearer ${config.anonKey}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        errors.push('Authentication failed - check your SUPABASE_ANON_KEY')
      } else if (response.status === 404) {
        errors.push('Supabase project not found - check your SUPABASE_URL')
      } else {
        errors.push(`Connection failed with status ${response.status}`)
      }
    }

    // Test realtime endpoint
    const realtimeResponse = await fetch(`${config.url.replace('https://', 'wss://')}/realtime/v1/websocket`, {
      method: 'HEAD',
    }).catch(() => null)

    if (!realtimeResponse) {
      warnings.push('Realtime endpoint may not be accessible')
    }

  } catch (error) {
    errors.push(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Log validation results
 */
export function logValidationResults(result: ValidationResult, context: string = 'Supabase Config') {
  if (result.isValid) {
    console.log(`✅ ${context} validation passed`)
  } else {
    console.error(`❌ ${context} validation failed:`)
    result.errors.forEach(error => console.error(`  - ${error}`))
  }

  if (result.warnings.length > 0) {
    console.warn(`⚠️ ${context} warnings:`)
    result.warnings.forEach(warning => console.warn(`  - ${warning}`))
  }
}

/**
 * Initialize and validate Supabase configuration
 */
export function initializeSupabaseValidation() {
  if (typeof window !== 'undefined') {
    // Client-side validation
    const result = validateSupabaseConfig()
    logValidationResults(result, 'Client-side Supabase Config')
    
    if (result.config && process.env.NODE_ENV === 'development') {
      // Test connection in development
      validateSupabaseConnection(result.config).then(connectionResult => {
        logValidationResults(connectionResult, 'Supabase Connection')
      })
    }
    
    return result
  } else {
    // Server-side validation
    const result = validateSupabaseConfig()
    logValidationResults(result, 'Server-side Supabase Config')
    return result
  }
}

// Auto-initialize in development
if (process.env.NODE_ENV === 'development') {
  initializeSupabaseValidation()
}
