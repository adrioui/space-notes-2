/**
 * DEMO OTP Service - Complete Bypass System
 * 
 * This service completely bypasses all external dependencies:
 * - No email sending (nodemailer disabled)
 * - No SMS sending (Twilio disabled)
 * - All OTP verifications return success
 * - Demo accounts work with any OTP code
 * - Regular accounts work with any OTP code
 * 
 * Perfect for development, testing, and demo environments
 */

interface OTPData {
  code: string;
  contact: string;
  expiresAt: Date;
  attempts: number;
}

// In-memory OTP storage (for demo purposes)
const otpStorage = new Map<string, OTPData>();

export class DemoOTPService {
  private initialized = false;

  constructor() {
    console.log('🎭 DEMO OTP Service initialized - all external services bypassed');
  }

  private validateConfiguration() {
    if (this.initialized) return;
    
    console.log('🎭 DEMO MODE: Skipping all external service validation');
    this.initialized = true;
  }

  private isDemoModeEnabled(): boolean {
    // Always enabled in this demo service
    return true;
  }

  private isDemoAccount(contact: string): boolean {
    const demoEmails = ['demo-admin@example.com', 'demo-member@example.com'];
    return demoEmails.includes(contact.toLowerCase());
  }

  private isEmail(contact: string): boolean {
    return contact.includes('@');
  }

  private isPhone(contact: string): boolean {
    return /^\+?[\d\s\-\(\)]+$/.test(contact);
  }

  private generateOTP(contact?: string): string {
    // For demo accounts, always return 123456
    if (contact && this.isDemoAccount(contact)) {
      return '123456';
    }
    // For other accounts, generate a random 6-digit code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOTP(contact: string): Promise<{ success: boolean; message: string; debugOTP?: string }> {
    try {
      this.validateConfiguration();

      // Validate contact format
      if (!this.isEmail(contact) && !this.isPhone(contact)) {
        return { 
          success: false, 
          message: "Invalid contact format. Use email or phone number with country code (e.g., +1234567890)" 
        };
      }

      // Generate OTP
      const code = this.generateOTP(contact);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP in memory
      otpStorage.set(contact, {
        code,
        contact,
        expiresAt,
        attempts: 0,
      });

      // Demo mode: Always return success without sending anything
      console.log(`🎭 DEMO OTP for ${contact}: ${code} (expires at ${expiresAt.toISOString()})`);

      if (this.isDemoAccount(contact)) {
        return {
          success: true,
          message: "Demo account detected! Use any 6-digit code to sign in.",
          debugOTP: code
        };
      }

      return {
        success: true,
        message: "OTP sent successfully! (Demo mode - check console for code)",
        debugOTP: code
      };

    } catch (error) {
      console.error('Demo OTP Service error:', error);
      return { 
        success: false, 
        message: "Failed to send OTP. Please try again." 
      };
    }
  }

  verifyOTP(contact: string, inputCode: string): { success: boolean; message: string; user?: any } {
    this.validateConfiguration();

    // Demo account bypass - always succeeds
    if (this.isDemoAccount(contact)) {
      console.log(`🎭 DEMO BYPASS: Auto-approving OTP for demo account: ${contact}`);

      const isAdmin = contact.toLowerCase() === 'demo-admin@example.com';
      return {
        success: true,
        message: "Demo account verified successfully!",
        user: {
          id: isAdmin ? '550e8400-e29b-41d4-a716-446655440001' : '550e8400-e29b-41d4-a716-446655440002',
          email: contact,
          name: isAdmin ? 'Demo Admin' : 'Demo Member',
          role: isAdmin ? 'admin' : 'member'
        }
      };
    }

    // For non-demo accounts, check stored OTP
    const storedOTP = otpStorage.get(contact);
    
    if (!storedOTP) {
      return { 
        success: false, 
        message: "No OTP found. Please request a new one." 
      };
    }

    // Check expiration
    if (new Date() > storedOTP.expiresAt) {
      otpStorage.delete(contact);
      return { 
        success: false, 
        message: "OTP has expired. Please request a new one." 
      };
    }

    // Check attempts
    if (storedOTP.attempts >= 3) {
      otpStorage.delete(contact);
      return { 
        success: false, 
        message: "Too many failed attempts. Please request a new OTP." 
      };
    }

    // In demo mode, accept any 6-digit code
    if (inputCode.length === 6 && /^\d{6}$/.test(inputCode)) {
      otpStorage.delete(contact);
      console.log(`🎭 DEMO MODE: Accepting any valid 6-digit OTP for ${contact}`);
      
      return {
        success: true,
        message: "OTP verified successfully! (Demo mode)",
        user: {
          id: `user-${Date.now()}`,
          email: this.isEmail(contact) ? contact : null,
          phone: this.isPhone(contact) ? contact : null,
          name: this.isEmail(contact) ? contact.split('@')[0] : contact,
          role: 'member'
        }
      };
    }

    // Increment attempts
    storedOTP.attempts++;
    otpStorage.set(contact, storedOTP);

    return { 
      success: false, 
      message: `Invalid OTP. ${3 - storedOTP.attempts} attempts remaining.` 
    };
  }

  // Cleanup expired OTPs
  startCleanupTimer() {
    console.log('🎭 DEMO OTP Service: Starting cleanup timer');
    setInterval(() => {
      const now = new Date();
      // Convert entries to array to avoid iteration issues
      const entries = Array.from(otpStorage.entries());
      for (const [contact, otp] of entries) {
        if (now > otp.expiresAt) {
          otpStorage.delete(contact);
          console.log(`🎭 Cleaned up expired OTP for ${contact}`);
        }
      }
    }, 5 * 60 * 1000); // Clean up every 5 minutes
  }

  // Get current OTP for debugging (demo mode only)
  getDebugOTP(contact: string): string | null {
    const stored = otpStorage.get(contact);
    return stored ? stored.code : null;
  }

  // Clear all OTPs (demo mode only)
  clearAllOTPs() {
    otpStorage.clear();
    console.log('🎭 DEMO MODE: Cleared all stored OTPs');
  }
}

// Create and export the demo service instance
export const otpService = new DemoOTPService();

// Start cleanup timer when the service is imported
if (typeof window === 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build') {
  try {
    otpService.startCleanupTimer();
  } catch (error) {
    console.log('🎭 DEMO OTP Service: Cleanup timer initialization deferred');
  }
}
