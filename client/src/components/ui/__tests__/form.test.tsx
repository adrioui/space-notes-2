import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../../test/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'

// Mock form components for testing
const Form = ({ children, ...props }: any) => <form {...props}>{children}</form>
const FormControl = ({ children }: any) => <div>{children}</div>
const FormField = ({ render }: { render: (props: { field: any }) => React.ReactNode }) => render({ field: { value: '', onChange: () => {} } })
const FormItem = ({ children }: any) => <div>{children}</div>
const FormLabel = ({ children }: any) => <label>{children}</label>
const FormMessage = () => <div />
const Input = (props: any) => <input {...props} />
const Button = ({ children, ...props }: any) => <button {...props}>{children}</button>

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

type FormData = z.infer<typeof formSchema>

const TestForm = ({ onSubmit }: { onSubmit: (data: FormData) => void }) => {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [errors, setErrors] = useState<{ email?: string; name?: string }>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: { email?: string; name?: string } = {}
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    // Validate name
    if (name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }
    
    setErrors(newErrors)
    
    if (Object.keys(newErrors).length === 0) {
      onSubmit({ email, name })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Email</label>
        <div>
          <input 
            data-testid="input-email" 
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {errors.email && <div style={{ color: 'red' }}>{errors.email}</div>}
      </div>
      <div>
        <label>Name</label>
        <div>
          <input 
            data-testid="input-name" 
            placeholder="Enter name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        {errors.name && <div style={{ color: 'red' }}>{errors.name}</div>}
      </div>
      <button data-testid="button-submit" type="submit">
        Submit
      </button>
    </form>
  )
}

describe('Form Components', () => {
  it('renders form fields correctly', () => {
    const mockSubmit = vi.fn()
    render(<TestForm onSubmit={mockSubmit} />)

    expect(screen.getByTestId('input-email')).toBeInTheDocument()
    expect(screen.getByTestId('input-name')).toBeInTheDocument()
    expect(screen.getByTestId('button-submit')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
  })

  it('validates form fields on submit', async () => {
    const user = userEvent.setup()
    const mockSubmit = vi.fn()
    render(<TestForm onSubmit={mockSubmit} />)

    const submitButton = screen.getByTestId('button-submit')
    await user.click(submitButton)

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
      expect(screen.getByText('Name must be at least 2 characters')).toBeInTheDocument()
    })

    expect(mockSubmit).not.toHaveBeenCalled()
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const mockSubmit = vi.fn()
    render(<TestForm onSubmit={mockSubmit} />)

    const emailInput = screen.getByTestId('input-email')
    const nameInput = screen.getByTestId('input-name')
    const submitButton = screen.getByTestId('button-submit')

    await user.type(emailInput, 'test@example.com')
    await user.type(nameInput, 'Test User')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
      })
    })
  })
})