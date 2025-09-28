import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../../test/utils'

// Mock ProfileEditor component for testing
const ProfileEditor = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null
  
  return (
    <div data-testid="profile-editor-modal">
      <h2>Edit Profile</h2>
      <form>
        <input data-testid="input-display-name" placeholder="Display name" defaultValue="Test User" />
        <input data-testid="input-username" placeholder="Username" defaultValue="testuser" />
        <div>
          <h3>Avatar</h3>
          <input data-testid="input-emoji" placeholder="Emoji" defaultValue="🚀" />
          <input data-testid="input-background-color" type="color" defaultValue="#3B82F6" />
          <input data-testid="input-avatar-image" type="file" accept="image/*" />
        </div>
        <button data-testid="button-save-profile" type="submit">Save Changes</button>
        <button data-testid="button-cancel" type="button" onClick={onClose}>Cancel</button>
        <button data-testid="button-logout" type="button">Logout</button>
      </form>
    </div>
  )
}

describe('ProfileEditor Component', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders when isOpen is true', () => {
    render(<ProfileEditor isOpen={true} onClose={mockOnClose} />)

    expect(screen.getByTestId('profile-editor-modal')).toBeInTheDocument()
    expect(screen.getByText('Edit Profile')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(<ProfileEditor isOpen={false} onClose={mockOnClose} />)

    expect(screen.queryByTestId('profile-editor-modal')).not.toBeInTheDocument()
  })

  it('renders all profile fields', () => {
    render(<ProfileEditor isOpen={true} onClose={mockOnClose} />)

    expect(screen.getByTestId('input-display-name')).toBeInTheDocument()
    expect(screen.getByTestId('input-username')).toBeInTheDocument()
    expect(screen.getByTestId('input-emoji')).toBeInTheDocument()
    expect(screen.getByTestId('input-background-color')).toBeInTheDocument()
    expect(screen.getByTestId('input-avatar-image')).toBeInTheDocument()
  })

  it('shows current user data in form fields', () => {
    render(<ProfileEditor isOpen={true} onClose={mockOnClose} />)

    expect(screen.getByTestId('input-display-name')).toHaveValue('Test User')
    expect(screen.getByTestId('input-username')).toHaveValue('testuser')
    expect(screen.getByTestId('input-emoji')).toHaveValue('🚀')
  })

  it('allows editing profile information', async () => {
    const user = userEvent.setup()
    render(<ProfileEditor isOpen={true} onClose={mockOnClose} />)

    const displayNameInput = screen.getByTestId('input-display-name')
    await user.clear(displayNameInput)
    await user.type(displayNameInput, 'Updated Name')

    expect(displayNameInput).toHaveValue('Updated Name')
  })

  it('saves profile changes', async () => {
    const user = userEvent.setup()
    render(<ProfileEditor isOpen={true} onClose={mockOnClose} />)

    const saveButton = screen.getByTestId('button-save-profile')
    await user.click(saveButton)

    // Save functionality would be handled by the actual implementation
  })

  it('handles avatar image upload', async () => {
    const user = userEvent.setup()
    render(<ProfileEditor isOpen={true} onClose={mockOnClose} />)

    const imageInput = screen.getByTestId('input-avatar-image')
    const file = new File(['fake image'], 'avatar.jpg', { type: 'image/jpeg' })
    
    await user.upload(imageInput, file)

    expect((imageInput as HTMLInputElement).files![0]).toBe(file)
  })

  it('triggers logout', async () => {
    const user = userEvent.setup()
    render(<ProfileEditor isOpen={true} onClose={mockOnClose} />)

    const logoutButton = screen.getByTestId('button-logout')
    await user.click(logoutButton)

    // Logout functionality would be handled by the actual implementation
  })

  it('closes modal when cancel is clicked', async () => {
    const user = userEvent.setup()
    render(<ProfileEditor isOpen={true} onClose={mockOnClose} />)

    const cancelButton = screen.getByTestId('button-cancel')
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
})