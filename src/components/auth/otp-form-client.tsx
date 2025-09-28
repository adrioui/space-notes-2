'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { useToast } from '@/hooks/use-toast'
import ProfileSetup from './profile-setup-client'

const contactSchema = z.object({
  contact: z.string().min(1, 'Please enter your email or phone number'),
})

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

type ContactForm = z.infer<typeof contactSchema>
type OTPForm = z.infer<typeof otpSchema>

// Helper function to detect demo accounts
const isDemoAccount = (email: string): boolean => {
  return ['demo-admin@example.com', 'demo-member@example.com'].includes(email.toLowerCase())
}

export default function OTPFormClient() {
  const [step, setStep] = useState<'contact' | 'otp' | 'profile'>('contact')
  const [contact, setContact] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [debugOTP, setDebugOTP] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const contactForm = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { contact: '' },
  })

  const otpForm = useForm<OTPForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  })

  const handleSendOTP = async (data: ContactForm) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact: data.contact }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send OTP')
      }

      setContact(data.contact)

      // Check if this is a demo account that should auto-login
      if (result.isDemoAccount && result.autoLogin) {
        console.log('🎭 Demo account detected - auto-authenticating')

        toast({
          title: 'Demo Account Detected',
          description: 'Automatically signing you in...',
        })

        // Auto-authenticate demo account using NextAuth
        const authResult = await signIn('otp', {
          contact: data.contact,
          otp: '123456', // Demo accounts accept any OTP
          redirect: false,
        })

        if (authResult?.error) {
          throw new Error(authResult.error)
        }

        if (authResult?.ok) {
          toast({
            title: 'Welcome!',
            description: 'Demo account signed in successfully.',
          })
          router.push('/dashboard')
          return
        }
      } else {
        // Regular account - proceed to OTP step
        setStep('otp')

        // Store debug OTP if provided (development mode only)
        if (result.debugOTP) {
          setDebugOTP(result.debugOTP)
        }

        toast({
          title: 'OTP Sent',
          description: result.debugOTP
            ? `OTP sent! Development mode - your code is: ${result.debugOTP}`
            : 'Please check your email or phone for the verification code.',
        })
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (data: OTPForm) => {
    setIsLoading(true)
    try {
      // Use NextAuth signIn with OTP provider
      const result = await signIn('otp', {
        contact,
        otp: data.otp,
        redirect: false,
      })
      
      if (result?.error) {
        throw new Error(result.error)
      }
      
      if (result?.ok) {
        router.push('/dashboard')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileComplete = () => {
    router.push('/dashboard')
  }

  if (step === 'profile') {
    return <ProfileSetup contact={contact} onComplete={handleProfileComplete} />
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Welcome to Spaces</h1>
            <p className="text-muted-foreground mt-2">
              {step === 'contact'
                ? 'Enter your email or phone number to get started'
                : 'Enter the verification code we sent you'
              }
            </p>
            {step === 'contact' && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border text-sm">
                <p className="font-medium text-gray-700 mb-2">Try Demo Accounts (Instant Login):</p>
                <div className="space-y-1 text-gray-600">
                  <div>👑 <code className="bg-white px-2 py-1 rounded">demo-admin@example.com</code> (Admin)</div>
                  <div>👤 <code className="bg-white px-2 py-1 rounded">demo-member@example.com</code> (Member)</div>
                </div>
              </div>
            )}
          </div>

          {step === 'contact' ? (
            <Form {...contactForm}>
              <form onSubmit={contactForm.handleSubmit(handleSendOTP)} className="w-full space-y-4">
                <FormField
                  control={contactForm.control}
                  name="contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email or Phone</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="you@example.com or +1234567890"
                          disabled={isLoading}
                          data-testid="input-contact"
                        />
                      </FormControl>
                      {/* Demo account indicator */}
                      {field.value && isDemoAccount(field.value) && (
                        <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded-md border border-blue-200">
                          🎭 <strong>Demo Account Detected!</strong> This account will be automatically signed in without requiring an OTP code.
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-send-otp"
                >
                  {isLoading
                    ? (isDemoAccount(contactForm.watch('contact')) ? 'Signing In...' : 'Sending...')
                    : (isDemoAccount(contactForm.watch('contact')) ? 'Sign In Instantly' : 'Send Verification Code')
                  }
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(handleVerifyOTP)} className="w-full space-y-4">
                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <div className="flex justify-center">
                          <InputOTP maxLength={6} {...field} data-testid="input-otp">
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Development Mode Debug Panel */}
                {process.env.NODE_ENV === 'development' && debugOTP && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="text-yellow-800 font-medium">🔧 Development Mode</div>
                    </div>
                    <div className="mt-2 text-sm text-yellow-700">
                      <strong>Debug OTP:</strong>
                      <span className="ml-2 font-mono text-lg font-bold text-yellow-900 bg-yellow-100 px-2 py-1 rounded">
                        {debugOTP}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-yellow-600">
                      This debug panel only appears in development mode
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 text-xs"
                      onClick={() => otpForm.setValue('otp', debugOTP)}
                    >
                      Auto-fill OTP
                    </Button>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-verify-otp"
                >
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setStep('contact')
                    setDebugOTP(null)
                  }}
                  disabled={isLoading}
                  data-testid="button-back"
                >
                  Back
                </Button>
              </form>
            </Form>
          )}
        </div>
      </CardContent>
    </Card>
  )
}