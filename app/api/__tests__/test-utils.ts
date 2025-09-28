import { vi } from 'vitest'
import { NextRequest } from 'next/server'

/**
 * Test utilities for API route testing
 */

// Mock session for authenticated tests
export const mockAuthenticatedSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  },
}

// Mock session for unauthenticated tests
export const mockUnauthenticatedSession = null

/**
 * Create a mock NextRequest for testing
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string
    headers?: Record<string, string>
    body?: any
    searchParams?: Record<string, string>
  } = {}
): NextRequest {
  const { method = 'GET', headers = {}, body, searchParams } = options

  const requestUrl = new URL(url)
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      requestUrl.searchParams.set(key, value)
    })
  }

  const requestInit: ConstructorParameters<typeof NextRequest>[1] = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    requestInit.body = typeof body === 'string' ? body : JSON.stringify(body)
  }

  return new NextRequest(requestUrl, requestInit)
}

/**
 * Mock getServerSession to return authenticated session
 */
export function mockAuthenticatedUser() {
  const { getServerSession } = vi.hoisted(() => ({
    getServerSession: vi.fn(),
  }))

  vi.mock('next-auth', () => ({
    getServerSession,
  }))

  getServerSession.mockResolvedValue(mockAuthenticatedSession)
  return getServerSession
}

/**
 * Mock getServerSession to return unauthenticated session
 */
export function mockUnauthenticatedUser() {
  const { getServerSession } = vi.hoisted(() => ({
    getServerSession: vi.fn(),
  }))

  vi.mock('next-auth', () => ({
    getServerSession,
  }))

  getServerSession.mockResolvedValue(mockUnauthenticatedSession)
  return getServerSession
}

/**
 * Mock database operations
 */
export function mockDatabase() {
  const mockDb = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }

  vi.mock('@/lib/db', () => ({
    db: mockDb,
  }))

  return mockDb
}

/**
 * Create a mock database query chain
 */
export function createMockQueryChain(result: any) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(result),
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(result),
        }),
      }),
      innerJoin: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(result),
          }),
        }),
      }),
      orderBy: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(result),
      }),
    }),
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue(result),
    }),
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue(result),
      }),
    }),
    where: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue(result),
    }),
  }
}

/**
 * Assert that a response has the expected status and structure
 */
export async function assertResponse(
  response: Response,
  expectedStatus: number,
  expectedData?: any
) {
  expect(response.status).toBe(expectedStatus)
  
  if (expectedData !== undefined) {
    const data = await response.json()
    expect(data).toEqual(expectedData)
  }
}

/**
 * Assert that a response is an error with expected message
 */
export async function assertErrorResponse(
  response: Response,
  expectedStatus: number,
  expectedMessage?: string
) {
  expect(response.status).toBe(expectedStatus)
  
  const data = await response.json()
  expect(data).toHaveProperty('message')
  
  if (expectedMessage) {
    expect(data.message).toContain(expectedMessage)
  }
}

/**
 * Mock environment variables for testing
 */
export function mockEnvironmentVariables(vars: Record<string, string>) {
  const originalEnv = process.env
  
  beforeEach(() => {
    process.env = { ...originalEnv, ...vars }
  })
  
  afterEach(() => {
    process.env = originalEnv
  })
}

/**
 * Common test data
 */
export const testData = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    username: 'testuser',
    avatarType: 'emoji' as const,
    avatarData: { emoji: '🧪', backgroundColor: '#3B82F6' },
    phone: null,
    emailVerified: null,
    image: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  space: {
    id: 'test-space-id',
    name: 'Test Space',
    description: 'A test space',
    emoji: '🚀',
    wallpaper: 'neutral',
    inviteCode: 'TEST123',
    createdBy: 'test-user-id',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  message: {
    id: 'test-message-id',
    content: 'Test message',
    type: 'text' as const,
    spaceId: 'test-space-id',
    userId: 'test-user-id',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
}
