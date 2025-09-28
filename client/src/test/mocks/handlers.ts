import { http, HttpResponse } from 'msw'

// Mock user data
const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  username: 'testuser',
  displayName: 'Test User',
  avatarData: {
    emoji: '🚀',
    backgroundColor: '#3B82F6'
  }
}

// Mock spaces data
const mockSpaces = [
  {
    id: 'space-1',
    name: 'Test Space 1',
    description: 'First test space',
    emoji: '🚀',
    wallpaper: 'neutral',
    inviteCode: 'TEST123',
    createdBy: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    role: 'organizer',
    notificationLevel: 'all'
  },
  {
    id: 'space-2', 
    name: 'Test Space 2',
    description: 'Second test space',
    emoji: '📚',
    wallpaper: 'growth',
    inviteCode: 'TEST456',
    createdBy: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    role: 'organizer',
    notificationLevel: 'all'
  }
]

export const handlers = [
  // Auth endpoints
  http.get('/api/auth/me', () => {
    return HttpResponse.json({ user: mockUser })
  }),

  http.post('/api/auth/send-otp', () => {
    return HttpResponse.json({ success: true, message: 'OTP sent successfully' })
  }),

  http.post('/api/auth/verify-otp', () => {
    return HttpResponse.json({ 
      success: true, 
      isNewUser: false,
      contact: 'test@example.com'
    })
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true })
  }),

  // Spaces endpoints
  http.get('/api/spaces', () => {
    return HttpResponse.json(mockSpaces)
  }),

  http.post('/api/spaces', async ({ request }) => {
    const data = await request.json() as any
    const newSpace = {
      id: `space-${Date.now()}`,
      ...data,
      inviteCode: 'NEW123',
      createdBy: 'user-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      role: 'organizer',
      notificationLevel: 'all'
    }
    return HttpResponse.json(newSpace)
  }),

  // Messages endpoints  
  http.get('/api/spaces/:spaceId/messages', () => {
    return HttpResponse.json([])
  }),

  http.get('/api/spaces/:spaceId/members', () => {
    return HttpResponse.json([{
      id: 'member-1',
      userId: 'user-1',
      spaceId: 'space-1',
      role: 'organizer',
      user: mockUser
    }])
  }),

  // Notes endpoints
  http.get('/api/spaces/:spaceId/notes', () => {
    return HttpResponse.json([])
  }),

  // Lessons endpoints
  http.get('/api/spaces/:spaceId/lessons', () => {
    return HttpResponse.json([])
  }),
]