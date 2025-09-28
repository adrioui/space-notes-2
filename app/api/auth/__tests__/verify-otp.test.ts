import { describe, test, expect, vi, beforeEach } from 'vitest'
import { POST } from '../verify-otp/route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('../../../../src/lib/otp-service', () => ({
  otpService: {
    verifyOTP: vi.fn(),
  },
}))

vi.mock('../../../../src/lib/auth', () => ({
  findUserByContact: vi.fn(),
}))

import { otpService } from '../../../../src/lib/otp-service-demo'
import { findUserByContact } from '../../../../src/lib/auth'

describe('/api/auth/verify-otp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should verify OTP for existing user', async () => {
    // Arrange
    const mockVerifyOTP = vi.mocked(otpService.verifyOTP)
    const mockFindUser = vi.mocked(findUserByContact)
    
    mockVerifyOTP.mockReturnValue({
      success: true,
      message: 'OTP verified successfully',
    })
    
    mockFindUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User',
      username: 'testuser',
      avatarType: 'emoji',
      avatarData: { emoji: '🚀', backgroundColor: '#3B82F6' },
      phone: null,
      emailVerified: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const request = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contact: 'test@example.com', 
        otp: '123456' 
      }),
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.isNewUser).toBe(false)
    expect(data.user).toBeDefined()
    expect(data.user.email).toBe('test@example.com')
    expect(mockVerifyOTP).toHaveBeenCalledWith('test@example.com', '123456')
    expect(mockFindUser).toHaveBeenCalledWith('test@example.com')
  })

  test('should verify OTP for new user', async () => {
    // Arrange
    const mockVerifyOTP = vi.mocked(otpService.verifyOTP)
    const mockFindUser = vi.mocked(findUserByContact)
    
    mockVerifyOTP.mockReturnValue({
      success: true,
      message: 'OTP verified successfully',
    })
    
    mockFindUser.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contact: 'newuser@example.com', 
        otp: '123456' 
      }),
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.isNewUser).toBe(true)
    expect(data.requiresProfileCompletion).toBe(true)
    expect(data.contact).toBe('newuser@example.com')
    expect(mockVerifyOTP).toHaveBeenCalledWith('newuser@example.com', '123456')
    expect(mockFindUser).toHaveBeenCalledWith('newuser@example.com')
  })

  test('should return error for invalid OTP', async () => {
    // Arrange
    const mockVerifyOTP = vi.mocked(otpService.verifyOTP)
    
    mockVerifyOTP.mockReturnValue({
      success: false,
      message: 'Invalid or expired OTP',
    })

    const request = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contact: 'test@example.com', 
        otp: '000000' 
      }),
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.message).toBe('Invalid or expired OTP')
    expect(mockVerifyOTP).toHaveBeenCalledWith('test@example.com', '000000')
  })

  test('should return error for missing contact', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp: '123456' }),
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.message).toContain('Contact is required')
  })

  test('should return error for missing OTP', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact: 'test@example.com' }),
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.message).toContain('OTP must be 6 digits')
  })

  test('should return error for invalid OTP length', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contact: 'test@example.com', 
        otp: '12345' // Too short
      }),
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.message).toContain('OTP must be 6 digits')
  })

  test('should handle database error when finding user', async () => {
    // Arrange
    const mockVerifyOTP = vi.mocked(otpService.verifyOTP)
    const mockFindUser = vi.mocked(findUserByContact)
    
    mockVerifyOTP.mockReturnValue({
      success: true,
      message: 'OTP verified successfully',
    })
    
    mockFindUser.mockRejectedValue(new Error('Database connection failed'))

    const request = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contact: 'test@example.com', 
        otp: '123456' 
      }),
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.message).toBe('Internal server error')
  })

  test('should handle malformed JSON', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json',
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.message).toContain('Invalid request data')
  })
})
