// Script to disable SES lockdown for NextAuth compatibility
// This should be run before NextAuth initialization

if (typeof globalThis !== 'undefined') {
  // Disable SES lockdown
  globalThis.DISABLE_SES_LOCKDOWN = true
  
  // Prevent lockdown installation
  if (typeof globalThis.lockdown === 'function') {
    console.log('SES lockdown detected, attempting to disable...')
    try {
      // Override lockdown function to be a no-op
      globalThis.lockdown = () => {
        console.log('SES lockdown disabled for NextAuth compatibility')
      }
    } catch (error) {
      console.warn('Could not disable SES lockdown:', error)
    }
  }
}

// Export for potential use
export const disableSESLockdown = () => {
  if (typeof window === 'undefined' && typeof global !== 'undefined') {
    global.DISABLE_SES_LOCKDOWN = true
  }
}
