import twilio from 'twilio';
import nodemailer from 'nodemailer';

interface OTPData {
  code: string;
  contact: string;
  expiresAt: Date;
  attempts: number;
}

// In-memory OTP storage for development - in production this should use Redis or database
const otpStorage = new Map<string, OTPData>();

// Initialize Twilio client (will be undefined if credentials not provided)
let twilioClient: twilio.Twilio | undefined;
try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
} catch (error) {
  console.log('Twilio not configured - SMS OTP will not work');
}

// Initialize email transporter (will be undefined if credentials not provided)
let emailTransporter: nodemailer.Transporter | undefined;
let emailConfigured = false;

try {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.NODE_ENV === 'production') {
    emailTransporter = nodemailer.createTransport({
      service: 'gmail', // You can change this to other email services
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use app password for Gmail
      },
    });
    emailConfigured = true;
  } else if (process.env.NODE_ENV === 'development') {
    console.log('Development mode: Email service disabled, using debug mode');
  }
} catch (error) {
  console.log('Email not configured - Email OTP will not work');
}

export class NextOTPService {
  constructor() {
    // Validate configuration in production
    if (process.env.NODE_ENV === 'production') {
      const hasEmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASS;
      const hasSMSConfig = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER;
      
      if (!hasEmailConfig && !hasSMSConfig) {
        throw new Error('OTP service requires either email configuration (EMAIL_USER, EMAIL_PASS) or SMS configuration (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) in production');
      }
    }
  }

  private generateOTP(contact?: string): string {
    // For demo accounts, use predictable OTPs for easier testing
    if (contact && this.isDemoAccount(contact)) {
      return '123456'; // Predictable OTP for demo accounts
    }
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private isDemoAccount(contact: string): boolean {
    const demoEmails = ['demo-admin@example.com', 'demo-member@example.com'];
    return demoEmails.includes(contact.toLowerCase());
  }

  private isEmail(contact: string): boolean {
    return contact.includes('@');
  }

  private isPhone(contact: string): boolean {
    // Simple phone number validation - starts with + and contains only digits
    return /^\+\d{10,15}$/.test(contact);
  }

  async sendOTP(contact: string): Promise<{ success: boolean; message: string; debugOTP?: string }> {
    try {
      // Validate contact format
      if (!this.isEmail(contact) && !this.isPhone(contact)) {
        return { success: false, message: "Invalid contact format. Use email or phone number with country code (e.g., +1234567890)" };
      }

      // Generate and store OTP
      const code = this.generateOTP(contact);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      
      otpStorage.set(contact, {
        code,
        contact,
        expiresAt,
        attempts: 0
      });

      // Send OTP based on contact type
      let result;
      if (this.isEmail(contact)) {
        result = await this.sendEmailOTP(contact, code);
      } else {
        result = await this.sendSMSOTP(contact, code);
      }

      // In development mode, include the OTP code for debugging
      if (process.env.NODE_ENV === 'development' && result.success) {
        return { ...result, debugOTP: code };
      }

      return result;
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      return { success: false, message: "Failed to send OTP" };
    }
  }

  private async sendEmailOTP(email: string, code: string): Promise<{ success: boolean; message: string }> {
    // In development mode, always use debug mode regardless of email configuration
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV MODE] Email OTP for ${email}: ${code}`);

      // Special message for demo accounts
      if (this.isDemoAccount(email)) {
        console.log(`[DEMO BYPASS] Demo account detected: ${email} - OTP verification will be automatically bypassed`);
        return {
          success: true,
          message: "Demo OTP sent! Note: OTP verification will be automatically bypassed for demo accounts in development mode."
        };
      }

      return {
        success: true,
        message: "OTP sent successfully (check console for development mode code)"
      };
    }

    if (!emailTransporter || !emailConfigured) {
      return {
        success: false,
        message: "Email service not configured. Please contact administrator."
      };
    }

    try {
      await emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Spaces App Login Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Your Login Code</h2>
            <p>Your verification code for Spaces is:</p>
            <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
              ${code}
            </div>
            <p>This code will expire in 5 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
        `
      });

      return { success: true, message: "OTP sent to your email" };
    } catch (error: any) {
      console.error('Email send error:', error);
      return { 
        success: false, 
        message: "Failed to send email. Please try again or use a different contact method." 
      };
    }
  }

  private async sendSMSOTP(phone: string, code: string): Promise<{ success: boolean; message: string }> {
    // In development mode, always use debug mode regardless of SMS configuration
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV MODE] SMS OTP for ${phone}: ${code}`);

      // Special handling for demo accounts (though demo accounts typically use email)
      if (this.isDemoAccount(phone)) {
        console.log(`[DEMO BYPASS] Demo account detected: ${phone} - OTP verification will be automatically bypassed`);
        return {
          success: true,
          message: "Demo OTP sent! Note: OTP verification will be automatically bypassed for demo accounts in development mode."
        };
      }

      return {
        success: true,
        message: "OTP sent successfully (check console for development mode code)"
      };
    }

    if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
      return {
        success: false,
        message: "SMS service not configured. Please contact administrator."
      };
    }

    try {
      await twilioClient.messages.create({
        body: `Your Spaces verification code is: ${code}. This code expires in 5 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });

      return { success: true, message: "OTP sent to your phone" };
    } catch (error: any) {
      console.error('SMS send error:', error);
      return { 
        success: false, 
        message: "Failed to send SMS. Please try again or use a different contact method." 
      };
    }
  }

  verifyOTP(contact: string, inputCode: string): { success: boolean; message: string; user?: any } {
    // Demo account bypass - only in development mode
    // This completely bypasses OTP verification for demo accounts to streamline testing
    if (process.env.NODE_ENV === 'development' && this.isDemoAccount(contact)) {
      console.log(`[DEMO BYPASS] Automatically bypassing OTP verification for demo account: ${contact}`);
      console.log(`[DEMO BYPASS] Input code was: ${inputCode} (ignored for demo accounts)`);

      // Clean up any existing OTP data for the demo account
      otpStorage.delete(contact);

      // Return successful verification response immediately
      const isEmail = this.isEmail(contact);
      return {
        success: true,
        message: "Demo account verified successfully (OTP bypass active in development)",
        user: {
          id: contact, // Temporary ID, will be replaced when user is created/found
          email: isEmail ? contact : null,
          phone: !isEmail ? contact : null,
          contact: contact
        }
      };
    }

    // Regular OTP verification for non-demo accounts and production environments
    const otpData = otpStorage.get(contact);

    if (!otpData) {
      return { success: false, message: "No OTP found for this contact. Please request a new one." };
    }

    // Check expiration
    if (new Date() > otpData.expiresAt) {
      otpStorage.delete(contact);
      return { success: false, message: "OTP has expired. Please request a new one." };
    }

    // Check attempts
    if (otpData.attempts >= 3) {
      otpStorage.delete(contact);
      return { success: false, message: "Too many failed attempts. Please request a new OTP." };
    }

    // Verify code
    if (otpData.code !== inputCode) {
      otpData.attempts++;
      return { success: false, message: "Invalid OTP. Please try again." };
    }

    // Success - clean up
    otpStorage.delete(contact);

    // Return user data for NextAuth
    const isEmail = this.isEmail(contact);
    return {
      success: true,
      message: "OTP verified successfully",
      user: {
        id: contact, // Temporary ID, will be replaced when user is created/found
        email: isEmail ? contact : null,
        phone: !isEmail ? contact : null,
        contact: contact
      }
    };
  }

  // Clean up expired OTPs periodically
  startCleanupTimer() {
    setInterval(() => {
      const now = new Date();
      Array.from(otpStorage.entries()).forEach(([contact, otpData]) => {
        if (now > otpData.expiresAt) {
          otpStorage.delete(contact);
        }
      });
    }, 60000); // Clean up every minute
  }
}

export const otpService = new NextOTPService();

// Start cleanup timer when the service is imported
if (typeof window === 'undefined') {
  // Only run on server side
  otpService.startCleanupTimer();
}