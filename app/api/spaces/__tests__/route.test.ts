import { describe, test, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '../route'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

// Mock database and utilities
vi.mock('../../../src/lib/db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}))

vi.mock('../../../src/lib/auth', () => ({
  authOptions: {},
}))

vi.mock('../../../src/lib/spaces', () => ({
  getUserSpaces: vi.fn(),
  createSpace: vi.fn(),
}))

import { getUserSpaces, createSpace } from '../../../src/lib/spaces'

describe('/api/spaces', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/spaces', () => {
    test('should return user spaces when authenticated', async () => {
      // Arrange
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
      }
      const mockSpaces = [
        {
          id: 'space-1',
          name: 'Test Space',
          description: 'A test space',
          emoji: '🚀',
          wallpaper: 'neutral',
          inviteCode: 'TEST123',
          createdBy: 'user-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          role: 'organizer',
          notificationLevel: 'all',
        },
      ]

      vi.mocked(getServerSession).mockResolvedValue(mockSession)
      vi.mocked(getUserSpaces).mockResolvedValue(mockSpaces)

      const request = new NextRequest('http://localhost:3000/api/spaces')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual(mockSpaces)
      expect(getUserSpaces).toHaveBeenCalledWith('user-1')
    })

    test('should return 401 when not authenticated', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/spaces')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.message).toBe('Not authenticated')
      expect(getUserSpaces).not.toHaveBeenCalled()
    })

    test('should handle database errors', async () => {
      // Arrange
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
      }

      vi.mocked(getServerSession).mockResolvedValue(mockSession)
      vi.mocked(getUserSpaces).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/spaces')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.message).toBe('Internal server error')
    })
  })

  describe('POST /api/spaces', () => {
    test('should create space when authenticated with valid data', async () => {
      // Arrange
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
      }
      const mockNewSpace = {
        id: 'space-new',
        name: 'New Test Space',
        description: 'A new test space',
        emoji: '🎯',
        wallpaper: 'growth',
        inviteCode: 'NEW123',
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        role: 'organizer',
        notificationLevel: 'all',
      }

      vi.mocked(getServerSession).mockResolvedValue(mockSession)
      vi.mocked(createSpace).mockResolvedValue(mockNewSpace)

      const request = new NextRequest('http://localhost:3000/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Test Space',
          description: 'A new test space',
          emoji: '🎯',
          wallpaper: 'growth',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data).toEqual(mockNewSpace)
      expect(createSpace).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          name: 'New Test Space',
          description: 'A new test space',
          emoji: '🎯',
          wallpaper: 'growth',
        })
      )
    })

    test('should return 401 when not authenticated', async () => {
      // Arrange
      vi.mocked(getServerSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Space',
          description: 'A test space',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.message).toBe('Not authenticated')
      expect(createSpace).not.toHaveBeenCalled()
    })

    test('should return 400 for invalid space data', async () => {
      // Arrange
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
      }

      vi.mocked(getServerSession).mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing required name field
          description: 'A test space',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.message).toContain('Invalid space data')
      expect(createSpace).not.toHaveBeenCalled()
    })

    test('should handle malformed JSON', async () => {
      // Arrange
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
      }

      vi.mocked(getServerSession).mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json',
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.message).toContain('Invalid request data')
      expect(createSpace).not.toHaveBeenCalled()
    })

    test('should handle database errors during space creation', async () => {
      // Arrange
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
      }

      vi.mocked(getServerSession).mockResolvedValue(mockSession)
      vi.mocked(createSpace).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Space',
          description: 'A test space',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data.message).toBe('Internal server error')
    })

    test('should create space with minimal required data', async () => {
      // Arrange
      const mockSession = {
        user: { id: 'user-1', email: 'test@example.com' },
      }
      const mockNewSpace = {
        id: 'space-minimal',
        name: 'Minimal Space',
        description: '',
        emoji: '📝',
        wallpaper: 'neutral',
        inviteCode: 'MIN123',
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        role: 'organizer',
        notificationLevel: 'all',
      }

      vi.mocked(getServerSession).mockResolvedValue(mockSession)
      vi.mocked(createSpace).mockResolvedValue(mockNewSpace)

      const request = new NextRequest('http://localhost:3000/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Minimal Space',
        }),
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data).toEqual(mockNewSpace)
      expect(createSpace).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          name: 'Minimal Space',
        })
      )
    })
  })
})
