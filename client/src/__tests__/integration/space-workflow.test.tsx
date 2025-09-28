import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../test/utils'

// Mock complete space workflow component
const SpaceWorkflow = () => {
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null)
  const [showCreator, setShowCreator] = useState<boolean>(false)

  const mockSpaces = [
    { id: 'space-1', name: 'Test Space 1', emoji: '🚀' },
    { id: 'space-2', name: 'Test Space 2', emoji: '📚' }
  ]

  return (
    <div data-testid="space-workflow">
      {/* Sidebar */}
      <div data-testid="sidebar">
        <button 
          data-testid="button-create-space"
          onClick={() => setShowCreator(true)}
        >
          Create Space
        </button>
        {mockSpaces.map(space => (
          <div 
            key={space.id}
            data-testid={`space-${space.id}`}
            onClick={() => setSelectedSpaceId(
              selectedSpaceId === space.id ? null : space.id
            )}
            className={selectedSpaceId === space.id ? 'selected' : ''}
          >
            {space.emoji} {space.name}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div data-testid="main-content">
        {selectedSpaceId ? (
          <div data-testid="space-content">
            <h2 data-testid="space-name">
              {mockSpaces.find(s => s.id === selectedSpaceId)?.name}
            </h2>
            <div data-testid="chat-area">Chat content for {selectedSpaceId}</div>
            <div data-testid="notes-area">Notes for {selectedSpaceId}</div>
          </div>
        ) : (
          <div data-testid="welcome-state">
            <p>No space selected</p>
            <p>Select a space to start chatting</p>
          </div>
        )}
      </div>

      {/* Space Creator Modal */}
      {showCreator && (
        <div data-testid="space-creator">
          <input data-testid="input-new-space-name" placeholder="Space name" />
          <button 
            data-testid="button-create-new-space"
            onClick={() => {
              setShowCreator(false)
              setSelectedSpaceId('space-new')
            }}
          >
            Create
          </button>
          <button 
            data-testid="button-cancel-creation"
            onClick={() => setShowCreator(false)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

// Import React for proper functionality
import { useState } from 'react'

describe('Space Workflow Integration', () => {

  it('completes full space selection workflow', async () => {
    const user = userEvent.setup()
    render(<SpaceWorkflow />)

    // Initial state - no space selected
    expect(screen.getByTestId('welcome-state')).toBeInTheDocument()
    expect(screen.getByText('No space selected')).toBeInTheDocument()

    // Select a space
    const space1 = screen.getByTestId('space-space-1')
    await user.click(space1)

    // Should show space content
    await waitFor(() => {
      expect(screen.getByTestId('space-content')).toBeInTheDocument()
      expect(screen.getByTestId('space-name')).toHaveTextContent('Test Space 1')
    })

    // Deselect space (toggle functionality)
    await user.click(space1)

    // Should return to welcome state
    await waitFor(() => {
      expect(screen.getByTestId('welcome-state')).toBeInTheDocument()
    })
  })

  it('completes space creation workflow', async () => {
    const user = userEvent.setup()
    render(<SpaceWorkflow />)

    // Open space creator
    const createButton = screen.getByTestId('button-create-space')
    await user.click(createButton)

    expect(screen.getByTestId('space-creator')).toBeInTheDocument()

    // Fill in space details
    const nameInput = screen.getByTestId('input-new-space-name')
    await user.type(nameInput, 'New Test Space')

    // Create the space
    const createNewButton = screen.getByTestId('button-create-new-space')
    await user.click(createNewButton)

    // Should close creator and select new space
    await waitFor(() => {
      expect(screen.queryByTestId('space-creator')).not.toBeInTheDocument()
      expect(screen.getByTestId('space-content')).toBeInTheDocument()
    })
  })

  it('allows canceling space creation', async () => {
    const user = userEvent.setup()
    render(<SpaceWorkflow />)

    // Open space creator
    const createButton = screen.getByTestId('button-create-space')
    await user.click(createButton)

    // Cancel creation
    const cancelButton = screen.getByTestId('button-cancel-creation')
    await user.click(cancelButton)

    // Should close creator and remain in welcome state
    await waitFor(() => {
      expect(screen.queryByTestId('space-creator')).not.toBeInTheDocument()
      expect(screen.getByTestId('welcome-state')).toBeInTheDocument()
    })
  })

  it('switches between multiple spaces', async () => {
    const user = userEvent.setup()
    render(<SpaceWorkflow />)

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
})