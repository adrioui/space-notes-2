import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@/test/utils'
import Dashboard from '../dashboard'

// Mock useAuth hook
const mockUseAuth = vi.fn()
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth()
}))

describe('Dashboard Component', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: 'user-1',
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User'
      }
    })
  })

  it('renders without auto-selecting any space', async () => {
    render(<Dashboard />)
    
    // Wait for spaces to load
    await waitFor(() => {
      expect(screen.getByText('Test Space 1')).toBeInTheDocument()
    })

    // Check that no space is auto-selected (should show welcome messages)
    expect(screen.getByText('No space selected')).toBeInTheDocument()
    expect(screen.getByText('Select a space to start chatting')).toBeInTheDocument()
  })

  it('shows welcome states in all panels when no space is selected', async () => {
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Space 1')).toBeInTheDocument()
    })

    // Chat section welcome state
    expect(screen.getByText('No space selected')).toBeInTheDocument()
    expect(screen.getByText('Select a space to start chatting')).toBeInTheDocument()

    // Notes panel welcome state  
    expect(screen.getByText('Select a space to view notes')).toBeInTheDocument()

    // Switch to lessons tab and check welcome state
    const lessonsTab = screen.getByTestId('tab-lessons')
    await userEvent.click(lessonsTab)
    
    expect(screen.getByText('Select a space to view lessons')).toBeInTheDocument()
  })

  it('allows space selection and shows active state', async () => {
    const user = userEvent.setup()
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Space 1')).toBeInTheDocument()
    })

    // Click on first space to select it
    const space1 = screen.getByTestId('space-space-1')
    await user.click(space1)

    // Should now show the space as selected (space name appears in header)
    await waitFor(() => {
      expect(screen.getByTestId('space-name')).toHaveTextContent('Test Space 1')
    })

    // Welcome message should be gone
    expect(screen.queryByText('No space selected')).not.toBeInTheDocument()
  })

  it('allows space deselection by clicking the same space again', async () => {
    const user = userEvent.setup()
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Space 1')).toBeInTheDocument()
    })

    // First click - select space
    const space1 = screen.getByTestId('space-space-1')
    await user.click(space1)

    // Verify space is selected
    await waitFor(() => {
      expect(screen.getByTestId('space-name')).toHaveTextContent('Test Space 1')
    })

    // Second click - deselect space
    await user.click(space1)

    // Should return to welcome state
    await waitFor(() => {
      expect(screen.getByText('No space selected')).toBeInTheDocument()
      expect(screen.getByText('Select a space to start chatting')).toBeInTheDocument()
    })
  })

  it('allows switching between different spaces', async () => {
    const user = userEvent.setup()
    render(<Dashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Space 1')).toBeInTheDocument()
      expect(screen.getByText('Test Space 2')).toBeInTheDocument()
    })

    // Select first space
    const space1 = screen.getByTestId('space-space-1')
    await user.click(space1)

    await waitFor(() => {
      expect(screen.getByTestId('space-name')).toHaveTextContent('Test Space 1')
    })

    // Switch to second space
    const space2 = screen.getByTestId('space-space-2')
    await user.click(space2)

    await waitFor(() => {
      expect(screen.getByTestId('space-name')).toHaveTextContent('Test Space 2')
    })
  })

  it('redirects to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null
    })

    render(<Dashboard />)
    
    // Should not render dashboard content
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument()
  })

  it('shows loading state while authentication is loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null
    })

    render(<Dashboard />)
    
    // Should show loading spinner (look for the actual element that's rendered)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })
})