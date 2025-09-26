'use client'

// Client-safe authentication utilities (no server-only dependencies)

export const clientAuthUtils = {
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  isValidPhone(phone: string): boolean {
    // Phone validation - must start with + and contain 10-15 digits
    const phoneRegex = /^\+\d{10,15}$/
    return phoneRegex.test(phone)
  },

  formatContact(contact: string): string {
    // Remove any extra whitespace
    contact = contact.trim()
    
    // If it looks like a phone number but doesn't start with +, add it
    if (/^\d{10,15}$/.test(contact)) {
      return '+' + contact
    }
    
    return contact
  },

  validateContact(contact: string): { valid: boolean; type: 'email' | 'phone' | null; message?: string } {
    const formatted = this.formatContact(contact)
    
    if (this.isValidEmail(formatted)) {
      return { valid: true, type: 'email' }
    }
    
    if (this.isValidPhone(formatted)) {
      return { valid: true, type: 'phone' }
    }
    
    return { 
      valid: false, 
      type: null, 
      message: 'Please enter a valid email address or phone number with country code (e.g., +1234567890)' 
    }
  }
}

export default clientAuthUtils