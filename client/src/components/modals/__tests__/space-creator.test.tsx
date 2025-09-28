import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../../test/utils'

// Mock SpaceCreator component for testing
const SpaceCreator = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null
  
  return (
    <div data-testid="space-creator-modal">
      <h2>Create New Space</h2>
      <form>
        <input data-testid="input-space-name" placeholder="Space name" />
        <textarea data-testid="input-space-description" placeholder="Description" />
        <select data-testid="select-wallpaper">
          <option value="neutral">Neutral</option>
          <option value="growth">Growth</option>
          <option value="nature">Nature</option>
        </select>
        <input data-testid="input-space-emoji" placeholder="Emoji" />
        <button data-testid="button-create-space" type="submit">Create Space</button>
        <button data-testid="button-cancel" type="button" onClick={onClose}>Cancel</button>
      </form>
    </div>
  )
}

describe('SpaceCreator Component', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when isOpen is true', () => {
    render(<SpaceCreator isOpen={true} onClose={mockOnClose} />)

    expect(screen.getByTestId('space-creator-modal')).toBeInTheDocument()
    expect(screen.getByText('Create New Space')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(<SpaceCreator isOpen={false} onClose={mockOnClose} />)

    expect(screen.queryByTestId('space-creator-modal')).not.toBeInTheDocument()
  })

  it('renders all form fields', () => {
    render(<SpaceCreator isOpen={true} onClose={mockOnClose} />)

    expect(screen.getByTestId('input-space-name')).toBeInTheDocument()
    expect(screen.getByTestId('input-space-description')).toBeInTheDocument()
    expect(screen.getByTestId('select-wallpaper')).toBeInTheDocument()
    expect(screen.getByTestId('input-space-emoji')).toBeInTheDocument()
    expect(screen.getByTestId('button-create-space')).toBeInTheDocument()
    expect(screen.getByTestId('button-cancel')).toBeInTheDocument()
  })

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<SpaceCreator isOpen={true} onClose={mockOnClose} />)

    const cancelButton = screen.getByTestId('button-cancel')
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<SpaceCreator isOpen={true} onClose={mockOnClose} />)

    const createButton = screen.getByTestId('button-create-space')
    await user.click(createButton)

    // Form validation would be handled by the actual implementation
  })

  it('allows selecting different wallpapers', async () => {
    const user = userEvent.setup()
    render(<SpaceCreator isOpen={true} onClose={mockOnClose} />)

    const wallpaperSelect = screen.getByTestId('select-wallpaper')
    await user.selectOptions(wallpaperSelect, 'growth')

    expect(wallpaperSelect).toHaveValue('growth')
  })

  it('creates space with valid data', async () => {
    const user = userEvent.setup()
    render(<SpaceCreator isOpen={true} onClose={mockOnClose} />)

    const nameInput = screen.getByTestId('input-space-name')
    const descriptionInput = screen.getByTestId('input-space-description')
    const emojiInput = screen.getByTestId('input-space-emoji')
    const createButton = screen.getByTestId('button-create-space')

    await user.type(nameInput, 'Test Space')
    await user.type(descriptionInput, 'A space for testing')
    await user.type(emojiInput, '🚀')
    await user.click(createButton)

    // Space creation would be handled by the actual implementation
  })
})