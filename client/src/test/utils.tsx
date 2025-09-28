import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Router } from 'wouter'
import { vi } from 'vitest'

// Mock AuthProvider with useAuth context
const mockAuthContext = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    phone: '+1234567890',
    displayName: 'Test User',
    username: 'testuser',
    avatarData: { emoji: '👤', backgroundColor: '#3b82f6' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  isLoading: false,
  isAuthenticated: true,
  logout: vi.fn(),
  setUser: vi.fn()
}

// Create AuthContext
import { createContext, useContext } from 'react'
const AuthContext = createContext(mockAuthContext)

// Mock useAuth hook
export const useAuth = () => mockAuthContext

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthContext.Provider value={mockAuthContext}>
      <div data-testid="auth-provider">{children}</div>
    </AuthContext.Provider>
  )
}

// Custom render function with providers
const AllProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          {children}
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }