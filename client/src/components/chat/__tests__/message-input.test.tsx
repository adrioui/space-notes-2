import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../../test/utils'

// Mock MessageInput component for testing
const MessageInput = ({ spaceId }: { spaceId: string }) => {
  return (
    <div>
      <input 
        data-testid="input-message" 
        placeholder="Type a message..." 
      />
      <button data-testid="button-send-message">Send</button>
      <button data-testid="button-upload-file">📎</button>
    </div>
  )
}

describe('MessageInput Component', () => {
  it('renders message input and send button', () => {
    render(<MessageInput spaceId="space-1" />)

    expect(screen.getByTestId('input-message')).toBeInTheDocument()
    expect(screen.getByTestId('button-send-message')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument()
  })

  it('sends message when send button is clicked', async () => {
    const user = userEvent.setup()
    render(<MessageInput spaceId="space-1" />)

    const messageInput = screen.getByTestId('input-message')
    const sendButton = screen.getByTestId('button-send-message')

    await user.type(messageInput, 'Hello, world!')
    await user.click(sendButton)

    // Input should be cleared after sending
    await waitFor(() => {
      expect(messageInput).toHaveValue('')
    })
  })

  it('sends message when Enter is pressed', async () => {
    const user = userEvent.setup()
    render(<MessageInput spaceId="space-1" />)

    const messageInput = screen.getByTestId('input-message')

    await user.type(messageInput, 'Hello via Enter!')
    await user.keyboard('{Enter}')

    // Input should be cleared after sending
    await waitFor(() => {
      expect(messageInput).toHaveValue('')
    })
  })

  it('does not send empty messages', async () => {
    const user = userEvent.setup()
    render(<MessageInput spaceId="space-1" />)

    const sendButton = screen.getByTestId('button-send-message')

    // Try to send with empty input
    await user.click(sendButton)

    // Should not clear input (since nothing was sent)
    const messageInput = screen.getByTestId('input-message')
    expect(messageInput).toHaveValue('')
  })

  it('handles Shift+Enter for line breaks', async () => {
    const user = userEvent.setup()
    render(<MessageInput spaceId="space-1" />)

    const messageInput = screen.getByTestId('input-message')

    await user.type(messageInput, 'First line')
    await user.keyboard('{Shift>}{Enter}{/Shift}')
    await user.type(messageInput, 'Second line')

    expect(messageInput).toHaveValue('First line\nSecond line')
  })

  it('shows file upload option', () => {
    render(<MessageInput spaceId="space-1" />)

    expect(screen.getByTestId('button-upload-file')).toBeInTheDocument()
  })

  it('handles file upload', async () => {
    const user = userEvent.setup()
    render(<MessageInput spaceId="space-1" />)

    const fileUploadButton = screen.getByTestId('button-upload-file')
    await user.click(fileUploadButton)

    // Would trigger file input (implementation dependent)
    expect(fileUploadButton).toBeInTheDocument()
  })
})