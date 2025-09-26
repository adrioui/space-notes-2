// Server-side authentication utilities
import { otpService } from './otp-service'

// Initialize OTP cleanup timer
otpService.startCleanupTimer()

// Server-side utility functions for authentication  
export const authUtils = {
  async sendOTP(contact: string) {
    return await otpService.sendOTP(contact)
  },

  verifyOTP(contact: string, otp: string) {
    return otpService.verifyOTP(contact, otp)
  }
}

export default authUtils