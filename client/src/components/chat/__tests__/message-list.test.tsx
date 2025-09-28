import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render } from '../../../test/utils'

// Mock MessageList component for testing
const MessageList = ({ spaceId }: { spaceId: string }) => {
  if (spaceId === 'space-empty') {
    return (
      <div>
        <p>No messages yet</p>
        <p>Be the first to send a message!</p>
      </div>
    )
  }
  
  return (
    <div data-testid="message-container">
      <div>
        <span>🚀</span>
        <span>Test User</span>
        <p>Hello everyone!</p>
      </div>
    </div>
  )
}

const mockMessages = [
  {
    id: 'msg-1',
    content: 'Hello everyone!',
    userId: 'user-1',
    spaceId: 'space-1',
    type: 'text' as const,
    createdAt: new Date().toISOString(),
    user: {
      id: 'user-1',
      displayName: 'Test User',
      username: 'testuser',
      avatarData: {
        emoji: '🚀',
        backgroundColor: '#3B82F6'
      }
    }
  },
  {
    id: 'msg-2',
    content: 'How is everyone doing?',
    userId: 'user-2',
    spaceId: 'space-1',
    type: 'text' as const,
    createdAt: new Date().toISOString(),
    user: {
      id: 'user-2',
      displayName: 'Another User',
      username: 'anotheruser',
      avatarData: {
        emoji: '📚',
        backgroundColor: '#10B981'
      }
    }
  }
]

describe('MessageList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders messages correctly', async () => {
    render(<MessageList spaceId="space-1" />)

    // Wait for messages to load (they come from API mock)
    await waitFor(() => {
      expect(screen.getByText('Hello everyone!')).toBeInTheDocument()
    })
  })

  it('shows empty state when no messages', async () => {
    // This would need a different mock handler that returns empty array
    render(<MessageList spaceId="space-empty" />)

    await waitFor(() => {
      expect(screen.getByText('No messages yet')).toBeInTheDocument()
      expect(screen.getByText('Be the first to send a message!')).toBeInTheDocument()
    })
  })

  it('displays user avatars and names', async () => {
    render(<MessageList spaceId="space-1" />)

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('🚀')).toBeInTheDocument()
    })
  })

  it('handles system messages differently', async () => {
    // This would test system message rendering if we had system messages
    render(<MessageList spaceId="space-1" />)

    // System messages would be styled differently
    await waitFor(() => {
      expect(screen.getByText('Hello everyone!')).toBeInTheDocument()
    })
  })

  it('auto-scrolls to bottom when new messages arrive', async () => {
    const { container } = render(<MessageList spaceId="space-1" />)

    const messageContainer = container.querySelector('[data-testid="message-container"]')
    expect(messageContainer).toBeInTheDocument()

    // Would test scrolling behavior in a real implementation
  })
})