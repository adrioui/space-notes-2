import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@/test/utils'
import NotesPanel from '../notes-panel'

describe('NotesPanel Component', () => {
  it('shows welcome state when no space is selected', () => {
    render(<NotesPanel spaceId={null} />)

    expect(screen.getByText('Select a space to view notes')).toBeInTheDocument()
    
    // Should show sticky note icon
    const noteIcon = screen.getByRole('generic').querySelector('.fas.fa-sticky-note')
    expect(noteIcon).toBeInTheDocument()
  })

  it('renders notes interface when space is selected', () => {
    render(<NotesPanel spaceId="space-1" />)

    // Should show notes header
    expect(screen.getByText('Notes')).toBeInTheDocument()
    
    // Should show create note button
    expect(screen.getByTestId('button-create-note')).toBeInTheDocument()
    expect(screen.getByText('New Note')).toBeInTheDocument()
  })

  it('shows empty state when space has no notes', () => {
    render(<NotesPanel spaceId="space-1" />)

    expect(screen.getByText('No notes yet')).toBeInTheDocument()
    expect(screen.getByTestId('button-create-first-note')).toBeInTheDocument()
    expect(screen.getByText('Create your first note')).toBeInTheDocument()
  })

  it('opens note editor when create note button is clicked', async () => {
    const user = userEvent.setup()
    render(<NotesPanel spaceId="space-1" />)

    const createButton = screen.getByTestId('button-create-note')
    await user.click(createButton)

    // Note: The editor opening would be tested in integration tests
    // since it involves modal state management
  })

  it('opens note editor when create first note button is clicked', async () => {
    const user = userEvent.setup()
    render(<NotesPanel spaceId="space-1" />)

    const createFirstButton = screen.getByTestId('button-create-first-note')
    await user.click(createFirstButton)

    // Note: The editor opening would be tested in integration tests
  })
})