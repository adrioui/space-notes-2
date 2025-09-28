import { describe, test, expect, vi, beforeEach } from 'vitest'
import { POST } from '../send-otp/route'
import { NextRequest } from 'next/server'
import { otpService } from '@/lib/otp-service-demo'

// Mock the OTP service
vi.mock('@/lib/otp-service', () => ({
  otpService: {
    sendOTP: vi.fn(),
  },
}))

describe('/api/auth/send-otp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should send OTP for valid email', async () => {
    // Arrange
    const mockSendOTP = vi.mocked(otpService.sendOTP)
    mockSendOTP.mockResolvedValue({
      success: true,
      message: 'OTP sent successfully',
    })

    const request = new NextRequest('http://localhost:3000/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact: 'test@example.com' }),
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('OTP sent successfully')
    expect(mockSendOTP).toHaveBeenCalledWith('test@example.com')
  })

  test('should send OTP for valid phone number', async () => {
    // Arrange
    const mockSendOTP = vi.mocked(otpService.sendOTP)
    mockSendOTP.mockResolvedValue({
      success: true,
      message: 'OTP sent successfully',
    })

    const request = new NextRequest('http://localhost:3000/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact: '+1234567890' }),
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockSendOTP).toHaveBeenCalledWith('+1234567890')
  })

  test('should return error for invalid contact format', async () => {
    // Arrange
    const mockSendOTP = vi.mocked(otpService.sendOTP)
    mockSendOTP.mockResolvedValue({
      success: false,
      message: 'Invalid contact format. Use email or phone number with country code (e.g., +1234567890)',
    })

    const request = new NextRequest('http://localhost:3000/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact: '123' }), // Too short for phone, no @ for email
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400) // API returns 400 for invalid contact
    expect(data.success).toBe(false)
    expect(data.message).toContain('Invalid contact format')
    expect(mockSendOTP).toHaveBeenCalledWith('123')
  })

  test('should return error for missing contact', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.message).toContain('Required') // Zod validation message
  })

  test('should handle OTP service failure', async () => {
    // Arrange
    const mockSendOTP = vi.mocked(otpService.sendOTP)
    mockSendOTP.mockResolvedValue({
      success: false,
      message: 'Email service unavailable',
    })

    const request = new NextRequest('http://localhost:3000/api/auth/send-otp', {
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
    expect(data.message).toBe('Email service unavailable')
  })

  test('should handle malformed JSON', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json',
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(500) // JSON parse error returns 500
    expect(data.success).toBe(false)
    expect(data.message).toContain('Internal server error')
  })

  test('should handle empty request body', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '',
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(500) // Empty body causes JSON parse error
    expect(data.success).toBe(false)
  })

  test('should handle OTP service throwing error', async () => {
    // Arrange
    const mockSendOTP = vi.mocked(otpService.sendOTP)
    mockSendOTP.mockRejectedValue(new Error('Network error'))

    const request = new NextRequest('http://localhost:3000/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact: 'test@example.com' }),
    })

    // Act
    const response = await POST(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.message).toBe('Internal server error')
  })
})
