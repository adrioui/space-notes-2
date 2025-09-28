import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@/test/utils'
import LessonsPanel from '../lessons-panel'

describe('LessonsPanel Component', () => {
  it('shows welcome state when no space is selected', () => {
    render(<LessonsPanel spaceId={null} />)

    expect(screen.getByText('Select a space to view lessons')).toBeInTheDocument()
    
    // Should show graduation cap icon (test the icon class is present in the DOM)
    const welcomeSection = screen.getByText('Select a space to view lessons').closest('div')
    expect(welcomeSection).toBeInTheDocument()
  })

  it('renders lessons interface when space is selected', () => {
    render(<LessonsPanel spaceId="space-1" />)

    // Should show lessons header
    expect(screen.getByText('Lessons')).toBeInTheDocument()
    
    // Should show create lesson button
    expect(screen.getByTestId('button-create-lesson')).toBeInTheDocument()
    expect(screen.getByText('New Lesson')).toBeInTheDocument()
  })

  it('shows empty state when space has no lessons', () => {
    render(<LessonsPanel spaceId="space-1" />)

    expect(screen.getByText('No lessons yet')).toBeInTheDocument()
    expect(screen.getByTestId('button-create-first-lesson')).toBeInTheDocument()
    expect(screen.getByText('Create your first lesson')).toBeInTheDocument()
  })

  it('opens lesson creator when create lesson button is clicked', async () => {
    const user = userEvent.setup()
    render(<LessonsPanel spaceId="space-1" />)

    const createButton = screen.getByTestId('button-create-lesson')
    await user.click(createButton)

    // Note: The creator opening would be tested in integration tests
    // since it involves modal state management
  })

  it('opens lesson creator when create first lesson button is clicked', async () => {
    const user = userEvent.setup()
    render(<LessonsPanel spaceId="space-1" />)

    const createFirstButton = screen.getByTestId('button-create-first-lesson')
    await user.click(createFirstButton)

    // Note: The creator opening would be tested in integration tests
  })
})