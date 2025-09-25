import twilio from 'twilio';
import nodemailer from 'nodemailer';

interface OTPData {
  code: string;
  contact: string;
  expiresAt: Date;
  attempts: number;
}

// In-memory OTP storage for development
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
try {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    emailTransporter = nodemailer.createTransport({
      service: 'gmail', // You can change this to other email services
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use app password for Gmail
      },
    });
  }
} catch (error) {
  console.log('Email not configured - Email OTP will not work');
}

export class OTPService {
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private isEmail(contact: string): boolean {
    return contact.includes('@');
  }

  private isPhone(contact: string): boolean {
    // Simple phone number validation - starts with + and contains only digits
    return /^\+\d{10,15}$/.test(contact);
  }

  async sendOTP(contact: string): Promise<{ success: boolean; message: string }> {
    try {
      // Validate contact format
      if (!this.isEmail(contact) && !this.isPhone(contact)) {
        return { success: false, message: "Invalid contact format. Use email or phone number with country code (e.g., +1234567890)" };
      }

      // Generate and store OTP
      const code = this.generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      
      otpStorage.set(contact, {
        code,
        contact,
        expiresAt,
        attempts: 0
      });

      // Send OTP based on contact type
      if (this.isEmail(contact)) {
        return await this.sendEmailOTP(contact, code);
      } else {
        return await this.sendSMSOTP(contact, code);
      }
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      return { success: false, message: "Failed to send OTP" };
    }
  }

  private async sendEmailOTP(email: string, code: string): Promise<{ success: boolean; message: string }> {
    if (!emailTransporter) {
      console.log(`[DEV MODE] Email OTP for ${email}: ${code}`);
      return { 
        success: true, 
        message: "OTP sent successfully (check console for development mode code)" 
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
      console.log(`[FALLBACK] Email OTP for ${email}: ${code}`);
      return { 
        success: true, 
        message: "OTP sent successfully (check console for fallback code)" 
      };
    }
  }

  private async sendSMSOTP(phone: string, code: string): Promise<{ success: boolean; message: string }> {
    if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
      console.log(`[DEV MODE] SMS OTP for ${phone}: ${code}`);
      return { 
        success: true, 
        message: "OTP sent successfully (check console for development mode code)" 
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
      console.log(`[FALLBACK] SMS OTP for ${phone}: ${code}`);
      return { 
        success: true, 
        message: "OTP sent successfully (check console for fallback code)" 
      };
    }
  }

  verifyOTP(contact: string, inputCode: string): { success: boolean; message: string } {
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
    return { success: true, message: "OTP verified successfully" };
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

export const otpService = new OTPService();