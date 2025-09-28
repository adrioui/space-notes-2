import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../../test/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

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
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      name: '',
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input data-testid="input-email" placeholder="Enter email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input data-testid="input-name" placeholder="Enter name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button data-testid="button-submit" type="submit">
          Submit
        </Button>
      </form>
    </Form>
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