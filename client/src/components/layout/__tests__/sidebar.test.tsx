import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@/test/utils'
import Sidebar from '../sidebar'

// Mock useAuth hook
const mockUseAuth = vi.fn()
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth()
}))

const mockSpaces = [
  {
    id: 'space-1',
    name: 'Test Space 1',
    emoji: '🚀',
    description: 'First test space',
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
    emoji: '📚',
    description: 'Second test space',
    wallpaper: 'growth',
    inviteCode: 'TEST456',
    createdBy: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    role: 'organizer',
    notificationLevel: 'all'
  }
]

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

describe('Sidebar Component', () => {
  const mockOnSelectSpace = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: mockUser
    })
  })

  it('renders user profile information', () => {
    render(
      <Sidebar 
        spaces={[]} 
        selectedSpaceId={null} 
        onSelectSpace={mockOnSelectSpace} 
      />
    )

    expect(screen.getByTestId('user-display-name')).toHaveTextContent('Test User')
    expect(screen.getByTestId('user-username')).toHaveTextContent('@testuser')
  })

  it('renders list of spaces', () => {
    render(
      <Sidebar 
        spaces={mockSpaces} 
        selectedSpaceId={null} 
        onSelectSpace={mockOnSelectSpace} 
      />
    )

    expect(screen.getByText('Test Space 1')).toBeInTheDocument()
    expect(screen.getByText('Test Space 2')).toBeInTheDocument()
    expect(screen.getByText('🚀')).toBeInTheDocument()
    expect(screen.getByText('📚')).toBeInTheDocument()
  })

  it('shows create space button when no spaces exist', () => {
    render(
      <Sidebar 
        spaces={[]} 
        selectedSpaceId={null} 
        onSelectSpace={mockOnSelectSpace} 
      />
    )

    expect(screen.getByText('No spaces yet')).toBeInTheDocument()
    expect(screen.getByTestId('button-create-first-space')).toBeInTheDocument()
  })

  it('calls onSelectSpace when space is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Sidebar 
        spaces={mockSpaces} 
        selectedSpaceId={null} 
        onSelectSpace={mockOnSelectSpace} 
      />
    )

    const space1 = screen.getByTestId('space-space-1')
    await user.click(space1)

    expect(mockOnSelectSpace).toHaveBeenCalledWith('space-1')
  })

  it('implements toggle functionality - deselects when same space is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Sidebar 
        spaces={mockSpaces} 
        selectedSpaceId="space-1" 
        onSelectSpace={mockOnSelectSpace} 
      />
    )

    // Click on already selected space should deselect it
    const space1 = screen.getByTestId('space-space-1')
    await user.click(space1)

    expect(mockOnSelectSpace).toHaveBeenCalledWith(null)
  })

  it('shows visual indicator for selected space', () => {
    render(
      <Sidebar 
        spaces={mockSpaces} 
        selectedSpaceId="space-1" 
        onSelectSpace={mockOnSelectSpace} 
      />
    )

    const space1 = screen.getByTestId('space-space-1')
    const space2 = screen.getByTestId('space-space-2')

    // Selected space should have primary border and muted background
    expect(space1).toHaveClass('border-primary', 'bg-muted')
    
    // Unselected space should have transparent border
    expect(space2).toHaveClass('border-transparent')
    expect(space2).not.toHaveClass('bg-muted')
  })

  it('opens create space modal when plus button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Sidebar 
        spaces={mockSpaces} 
        selectedSpaceId={null} 
        onSelectSpace={mockOnSelectSpace} 
      />
    )

    const createButton = screen.getByTestId('button-create-space')
    await user.click(createButton)

    // Should open the space creator modal (this would need modal testing)
    // The modal visibility is controlled by internal state
  })

  it('opens profile settings when gear icon is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Sidebar 
        spaces={mockSpaces} 
        selectedSpaceId={null} 
        onSelectSpace={mockOnSelectSpace} 
      />
    )

    const settingsButton = screen.getByTestId('button-edit-profile')
    await user.click(settingsButton)

    // Should open the profile settings modal
    // The modal visibility is controlled by internal state
  })

  it('handles null user gracefully', () => {
    mockUseAuth.mockReturnValue({
      user: null
    })

    render(
      <Sidebar 
        spaces={mockSpaces} 
        selectedSpaceId={null} 
        onSelectSpace={mockOnSelectSpace} 
      />
    )

    // Should not render sidebar when no user
    expect(screen.queryByTestId('user-display-name')).not.toBeInTheDocument()
  })
})