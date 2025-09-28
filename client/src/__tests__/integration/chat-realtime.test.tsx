import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test/utils'

// Mock real-time chat component
const RealtimeChat = ({ spaceId }: { spaceId: string }) => {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState<string>('')
  const [isConnected, setIsConnected] = useState<boolean>(false)

  useEffect(() => {
    // Simulate WebSocket connection
    setIsConnected(true)
    
    // Simulate receiving initial messages
    setTimeout(() => {
      setMessages([
        { id: '1', content: 'Hello everyone!', user: 'User 1', timestamp: new Date() },
        { id: '2', content: 'How is everyone doing?', user: 'User 2', timestamp: new Date() }
      ])
    }, 100)
  }, [spaceId])

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now().toString(),
        content: newMessage,
        user: 'Current User',
        timestamp: new Date()
      }
      setMessages((prev: any[]) => [...prev, message])
      setNewMessage('')
    }
  }

  return (
    <div data-testid="realtime-chat">
      <div data-testid="connection-status">
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>
      
      <div data-testid="messages-container">
        {messages.map((msg: any) => (
          <div key={msg.id} data-testid={`message-${msg.id}`}>
            <strong>{msg.user}: </strong>
            <span>{msg.content}</span>
          </div>
        ))}
      </div>

      <div data-testid="message-input-area">
        <input
          data-testid="input-new-message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button 
          data-testid="button-send-message"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>

      <div data-testid="online-members">
        <span>3 members online</span>
      </div>
    </div>
  )
}

// Import React for proper functionality
import { useState, useEffect } from 'react'

describe('Real-time Chat Integration', () => {

  it('establishes real-time connection', async () => {
    render(<RealtimeChat spaceId="space-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected')
    })
  })

  it('loads existing messages on connection', async () => {
    render(<RealtimeChat spaceId="space-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('message-1')).toBeInTheDocument()
      expect(screen.getByTestId('message-2')).toBeInTheDocument()
      expect(screen.getByText('Hello everyone!')).toBeInTheDocument()
    })
  })

  it('sends new message in real-time', async () => {
    const user = userEvent.setup()
    render(<RealtimeChat spaceId="space-1" />)

    const messageInput = screen.getByTestId('input-new-message')
    const sendButton = screen.getByTestId('button-send-message')

    await user.type(messageInput, 'New real-time message!')
    await user.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('New real-time message!')).toBeInTheDocument()
      expect(messageInput).toHaveValue('')
    })
  })

  it('sends message with Enter key', async () => {
    const user = userEvent.setup()
    render(<RealtimeChat spaceId="space-1" />)

    const messageInput = screen.getByTestId('input-new-message')

    await user.type(messageInput, 'Message via Enter{enter}')

    await waitFor(() => {
      expect(screen.getByText('Message via Enter')).toBeInTheDocument()
    })
  })

  it('shows online member count', async () => {
    render(<RealtimeChat spaceId="space-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('online-members')).toHaveTextContent('3 members online')
    })
  })

  it('handles empty messages correctly', async () => {
    const user = userEvent.setup()
    render(<RealtimeChat spaceId="space-1" />)

    const sendButton = screen.getByTestId('button-send-message')

    // Try to send empty message
    await user.click(sendButton)

    // Should not add empty message
    const messagesContainer = screen.getByTestId('messages-container')
    const messageCount = messagesContainer.children.length
    
    // Try again with just spaces
    const messageInput = screen.getByTestId('input-new-message')
    await user.type(messageInput, '   ')
    await user.click(sendButton)

    // Message count should remain the same
    expect(messagesContainer.children.length).toBe(messageCount)
  })
})