import { describe, test, expect, vi, beforeEach } from 'vitest'

// Mock all dependencies before importing the module under test
vi.mock('../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}))

vi.mock('@shared/schema', () => ({
  users: {
    email: 'email',
    phone: 'phone',
  },
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  or: vi.fn(),
}))

vi.mock('./otp-service', () => ({
  otpService: {
    sendOTP: vi.fn(),
    verifyOTP: vi.fn(),
  },
}))

vi.mock('next-auth', () => ({
  default: vi.fn(),
}))

vi.mock('@auth/drizzle-adapter', () => ({
  DrizzleAdapter: vi.fn(),
}))

vi.mock('next-auth/providers/credentials', () => ({
  default: vi.fn(),
}))

// Now import the functions to test
import { findUserByContact, createUserFromContact } from '../auth'
import { db } from '../db'
import { users } from '@shared/schema'

describe('Auth Helper Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('findUserByContact', () => {
    test('should find user by email', async () => {
      // Arrange
      const mockUser = {
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
      }

      const mockSelect = vi.mocked(db.select)
      const mockFrom = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockUser]),
        }),
      })
      mockSelect.mockReturnValue({ from: mockFrom })

      // Act
      const result = await findUserByContact('test@example.com')

      // Assert
      expect(result).toEqual(mockUser)
      expect(mockSelect).toHaveBeenCalled()
      expect(mockFrom).toHaveBeenCalledWith(users)
    })

    test('should find user by phone', async () => {
      // Arrange
      const mockUser = {
        id: 'user-1',
        phone: '+1234567890',
        displayName: 'Test User',
        username: 'testuser',
        avatarType: 'emoji',
        avatarData: { emoji: '🚀', backgroundColor: '#3B82F6' },
        email: null,
        emailVerified: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockSelect = vi.mocked(db.select)
      const mockFrom = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockUser]),
        }),
      })
      mockSelect.mockReturnValue({ from: mockFrom })

      // Act
      const result = await findUserByContact('+1234567890')

      // Assert
      expect(result).toEqual(mockUser)
      expect(mockSelect).toHaveBeenCalled()
    })

    test('should return null when user not found', async () => {
      // Arrange
      const mockSelect = vi.mocked(db.select)
      const mockFrom = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      })
      mockSelect.mockReturnValue({ from: mockFrom })

      // Act
      const result = await findUserByContact('nonexistent@example.com')

      // Assert
      expect(result).toBeNull()
    })

    test('should handle database errors', async () => {
      // Arrange
      const mockSelect = vi.mocked(db.select)
      const mockFrom = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockRejectedValue(new Error('Database error')),
        }),
      })
      mockSelect.mockReturnValue({ from: mockFrom })

      // Act & Assert
      await expect(findUserByContact('test@example.com')).rejects.toThrow('Database error')
    })
  })

  describe('createUserFromContact', () => {
    test('should create user with email contact', async () => {
      // Arrange
      const mockUser = {
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
      }

      const mockInsert = vi.mocked(db.insert)
      const mockValues = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockUser]),
      })
      mockInsert.mockReturnValue({ values: mockValues })

      const profileData = {
        displayName: 'Test User',
        username: 'testuser',
        avatarType: 'emoji' as const,
        avatarData: { emoji: '🚀', backgroundColor: '#3B82F6' },
      }

      // Act
      const result = await createUserFromContact('test@example.com', profileData)

      // Assert
      expect(result).toEqual(mockUser)
      expect(mockInsert).toHaveBeenCalledWith(users)
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          phone: null,
          displayName: 'Test User',
          username: 'testuser',
          avatarType: 'emoji',
          avatarData: { emoji: '🚀', backgroundColor: '#3B82F6' },
        })
      )
    })

    test('should create user with phone contact', async () => {
      // Arrange
      const mockUser = {
        id: 'user-1',
        phone: '+1234567890',
        displayName: 'Test User',
        username: 'testuser',
        avatarType: 'emoji',
        avatarData: { emoji: '🚀', backgroundColor: '#3B82F6' },
        email: null,
        emailVerified: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockInsert = vi.mocked(db.insert)
      const mockValues = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockUser]),
      })
      mockInsert.mockReturnValue({ values: mockValues })

      // Act
      const result = await createUserFromContact('+1234567890')

      // Assert
      expect(result).toEqual(mockUser)
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          email: null,
          phone: '+1234567890',
          displayName: '+1234567890',
        })
      )
    })

    test('should generate default values for email contact', async () => {
      // Arrange
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'test',
        username: expect.stringMatching(/test_\d+/),
        avatarType: 'emoji',
        avatarData: { emoji: '👤', backgroundColor: '#6B73FF' },
        phone: null,
        emailVerified: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockInsert = vi.mocked(db.insert)
      const mockValues = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockUser]),
      })
      mockInsert.mockReturnValue({ values: mockValues })

      // Act
      const result = await createUserFromContact('test@example.com')

      // Assert
      expect(result).toEqual(mockUser)
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          displayName: 'test',
          username: expect.stringMatching(/test_\d+/),
          avatarType: 'emoji',
          avatarData: { emoji: '👤', backgroundColor: '#6B73FF' },
        })
      )
    })

    test('should generate default values for phone contact', async () => {
      // Arrange
      const mockUser = {
        id: 'user-1',
        phone: '+1234567890',
        displayName: '+1234567890',
        username: expect.stringMatching(/user_\d+/),
        avatarType: 'emoji',
        avatarData: { emoji: '👤', backgroundColor: '#6B73FF' },
        email: null,
        emailVerified: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockInsert = vi.mocked(db.insert)
      const mockValues = vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockUser]),
      })
      mockInsert.mockReturnValue({ values: mockValues })

      // Act
      const result = await createUserFromContact('+1234567890')

      // Assert
      expect(result).toEqual(mockUser)
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '+1234567890',
          displayName: '+1234567890',
          username: expect.stringMatching(/user_\d+/),
        })
      )
    })

    test('should handle database errors during user creation', async () => {
      // Arrange
      const mockInsert = vi.mocked(db.insert)
      const mockValues = vi.fn().mockReturnValue({
        returning: vi.fn().mockRejectedValue(new Error('Database error')),
      })
      mockInsert.mockReturnValue({ values: mockValues })

      // Act & Assert
      await expect(createUserFromContact('test@example.com')).rejects.toThrow('Database error')
    })
  })
})
