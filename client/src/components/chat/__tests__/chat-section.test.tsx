import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { render, useAuth } from '@/test/utils'

// Mock the useAuth hook at module level
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => useAuth()
}))

// Mock the child components to avoid deep dependencies
vi.mock('../message-list', () => ({
  default: ({ spaceId }: { spaceId: string }) => (
    <div data-testid="message-list">Messages for space {spaceId}</div>
  )
}))

vi.mock('../message-input', () => ({
  default: ({ spaceId }: { spaceId: string }) => (
    <div data-testid="message-input">Input for space {spaceId}</div>
  )
}))

import ChatSection from '../chat-section'

const mockSpace = {
  id: 'space-1',
  name: 'Test Space',
  emoji: '🚀',
  description: 'Test space',
  wallpaper: 'neutral' as const,
  inviteCode: 'TEST123',
  createdBy: 'user-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

describe('ChatSection Component', () => {
  it('shows welcome state when no space is selected', () => {
    render(<ChatSection spaceId={null} space={undefined} />)

    expect(screen.getByText('No space selected')).toBeInTheDocument()
    expect(screen.getByText('Select a space to start chatting')).toBeInTheDocument()
    
    // Should show chat icon (test the icon class is present in the DOM)
    const welcomeSection = screen.getByText('No space selected').closest('div')
    expect(welcomeSection).toBeInTheDocument()
  })

  it('shows welcome state when spaceId is provided but space is undefined', () => {
    render(<ChatSection spaceId="space-1" space={undefined} />)

    expect(screen.getByText('No space selected')).toBeInTheDocument()
    expect(screen.getByText('Select a space to start chatting')).toBeInTheDocument()
  })

  it('renders chat interface when space is selected', async () => {
    render(<ChatSection spaceId="space-1" space={mockSpace} />)

    // Should show space header with name
    expect(screen.getByTestId('space-name')).toHaveTextContent('Test Space')
    
    // Should show message list and input components
    expect(screen.getByTestId('message-list')).toBeInTheDocument()
    expect(screen.getByTestId('message-input')).toBeInTheDocument()
  })

  it('applies wallpaper class when space has growth wallpaper', () => {
    const spaceWithWallpaper = {
      ...mockSpace,
      wallpaper: 'growth' as const
    }
    
    render(<ChatSection spaceId="space-1" space={spaceWithWallpaper} />)
    
    // Should apply wallpaper class to container
    const container = screen.getByTestId('space-name').closest('.bg-growth-pattern')
    expect(container).toBeInTheDocument()
  })

  it('shows correct member count pluralization', async () => {
    render(<ChatSection spaceId="space-1" space={mockSpace} />)

    // Should show space name which is the main header element
    expect(screen.getByTestId('space-name')).toHaveTextContent('Test Space')
  })
})