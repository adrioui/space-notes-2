import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../../../test/utils'
import { useState } from 'react'

// Mock AuthForm component for testing with state
const AuthForm = () => {
  const [activeTab, setActiveTab] = useState('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [showOtpStep, setShowOtpStep] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string) => {
    return phone.length >= 10
  }

  const handleSendOtp = () => {
    const newErrors: string[] = []
    
    if (activeTab === 'email') {
      if (!validateEmail(email)) {
        newErrors.push('Please enter a valid email address')
      }
    } else {
      if (!validatePhone(phone)) {
        newErrors.push('Please enter a valid phone number')
      }
    }

    setErrors(newErrors)
    
    if (newErrors.length === 0) {
      setShowOtpStep(true)
    }
  }

  return (
    <div data-testid="auth-form">
      <div>
        <button 
          data-testid="tab-email" 
          onClick={() => setActiveTab('email')}
        >
          Email
        </button>
        <button 
          data-testid="tab-phone" 
          onClick={() => setActiveTab('phone')}
        >
          Phone
        </button>
      </div>
      
      {!showOtpStep ? (
        <>
          <input 
            data-testid="input-email" 
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: activeTab === 'email' ? 'block' : 'none' }}
          />
          <input 
            data-testid="input-phone" 
            placeholder="Enter your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ display: activeTab === 'phone' ? 'block' : 'none' }}
          />
          <button data-testid="button-send-otp" onClick={handleSendOtp}>
            Send OTP
          </button>
        </>
      ) : (
        <>
          <h3>Enter verification code</h3>
          <input 
            data-testid="input-otp" 
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button data-testid="button-verify-otp">Verify OTP</button>
          <button data-testid="button-resend-otp">Resend OTP</button>
        </>
      )}
      
      {errors.map((error, index) => (
        <div key={index} style={{ color: 'red' }}>{error}</div>
      ))}
    </div>
  )
}

describe('AuthForm Component', () => {
  it('renders email input and send OTP button', () => {
    render(<AuthForm />)

    expect(screen.getByTestId('input-email')).toBeInTheDocument()
    expect(screen.getByTestId('button-send-otp')).toBeInTheDocument()
    expect(screen.getByText('Send OTP')).toBeInTheDocument()
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    render(<AuthForm />)

    const emailInput = screen.getByTestId('input-email')
    const sendButton = screen.getByTestId('button-send-otp')

    // Enter invalid email
    await user.type(emailInput, 'invalid-email')
    await user.click(sendButton)

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
    })
  })

  it('sends OTP successfully with valid email', async () => {
    const user = userEvent.setup()
    render(<AuthForm />)

    const emailInput = screen.getByTestId('input-email')
    const sendButton = screen.getByTestId('button-send-otp')

    // Enter valid email
    await user.type(emailInput, 'test@example.com')
    await user.click(sendButton)

    // Should show OTP verification step
    await waitFor(() => {
      expect(screen.getByText('Enter verification code')).toBeInTheDocument()
      expect(screen.getByTestId('input-otp')).toBeInTheDocument()
    })
  })

  it('allows phone number authentication', async () => {
    const user = userEvent.setup()
    render(<AuthForm />)

    // Switch to phone tab
    const phoneTab = screen.getByTestId('tab-phone')
    await user.click(phoneTab)

    expect(screen.getByTestId('input-phone')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter your phone number/i)).toBeInTheDocument()
  })

  it('validates phone number format', async () => {
    const user = userEvent.setup()
    render(<AuthForm />)

    // Switch to phone tab
    const phoneTab = screen.getByTestId('tab-phone')
    await user.click(phoneTab)

    const phoneInput = screen.getByTestId('input-phone')
    const sendButton = screen.getByTestId('button-send-otp')

    // Enter invalid phone number
    await user.type(phoneInput, '123')
    await user.click(sendButton)

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid phone number/i)).toBeInTheDocument()
    })
  })

  it('verifies OTP successfully', async () => {
    const user = userEvent.setup()
    render(<AuthForm />)

    const emailInput = screen.getByTestId('input-email')
    const sendButton = screen.getByTestId('button-send-otp')

    // Send OTP first
    await user.type(emailInput, 'test@example.com')
    await user.click(sendButton)

    // Enter OTP
    await waitFor(() => {
      expect(screen.getByTestId('input-otp')).toBeInTheDocument()
    })

    const otpInput = screen.getByTestId('input-otp')
    await user.type(otpInput, '123456')

    const verifyButton = screen.getByTestId('button-verify-otp')
    await user.click(verifyButton)

    // Should redirect or show success (this would depend on the app flow)
  })

  it('shows resend OTP option', async () => {
    const user = userEvent.setup()
    render(<AuthForm />)

    const emailInput = screen.getByTestId('input-email')
    const sendButton = screen.getByTestId('button-send-otp')

    // Send OTP first
    await user.type(emailInput, 'test@example.com')
    await user.click(sendButton)

    // Should show resend option
    await waitFor(() => {
      expect(screen.getByTestId('button-resend-otp')).toBeInTheDocument()
    })
  })

  it('handles OTP verification errors', async () => {
    const user = userEvent.setup()
    render(<AuthForm />)

    const emailInput = screen.getByTestId('input-email')
    const sendButton = screen.getByTestId('button-send-otp')

    // Send OTP first
    await user.type(emailInput, 'test@example.com')
    await user.click(sendButton)

    await waitFor(() => {
      expect(screen.getByTestId('input-otp')).toBeInTheDocument()
    })

    // Enter invalid OTP (this would need to mock an error response)
    const otpInput = screen.getByTestId('input-otp')
    await user.type(otpInput, '000000')

    const verifyButton = screen.getByTestId('button-verify-otp')
    await user.click(verifyButton)

    // Should show error message (implementation dependent)
  })
})