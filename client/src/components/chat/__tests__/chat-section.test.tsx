import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '@/test/utils'
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
    
    // Should show chat icon
    const chatIcon = screen.getByRole('generic').querySelector('.fas.fa-comments')
    expect(chatIcon).toBeInTheDocument()
  })

  it('shows welcome state when spaceId is provided but space is undefined', () => {
    render(<ChatSection spaceId="space-1" space={undefined} />)

    expect(screen.getByText('No space selected')).toBeInTheDocument()
    expect(screen.getByText('Select a space to start chatting')).toBeInTheDocument()
  })

  it('renders chat interface when space is selected', async () => {
    render(<ChatSection spaceId="space-1" space={mockSpace} />)

    // Should show space header with name and emoji
    expect(screen.getByTestId('space-name')).toHaveTextContent('Test Space')
    expect(screen.getByText('🚀')).toBeInTheDocument()
    
    // Should show member count
    expect(screen.getByText(/member.*online/)).toBeInTheDocument()
    
    // Should show action buttons
    expect(screen.getByTestId('button-show-members')).toBeInTheDocument()
    expect(screen.getByTestId('button-space-settings')).toBeInTheDocument()
  })

  it('applies wallpaper class when space has growth wallpaper', () => {
    const spaceWithWallpaper = {
      ...mockSpace,
      wallpaper: 'growth' as const
    }
    
    render(<ChatSection spaceId="space-1" space={spaceWithWallpaper} />)
    
    // Should apply wallpaper class to message area
    const messageArea = screen.getByText('Test Space').closest('.flex-1')?.querySelector('.wallpaper-growth')
    expect(messageArea).toBeInTheDocument()
  })

  it('shows correct member count pluralization', async () => {
    render(<ChatSection spaceId="space-1" space={mockSpace} />)

    // With 1 member, should show "1 member online"
    expect(screen.getByText('1 member online')).toBeInTheDocument()
  })
})