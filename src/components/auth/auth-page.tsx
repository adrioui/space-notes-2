'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { clientAuthUtils } from '@/lib/client-auth-utils'

export default function AuthPage() {
  const [contact, setContact] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'contact' | 'otp'>('contact')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Validate contact format
      const formatted = clientAuthUtils.formatContact(contact)
      const validation = clientAuthUtils.validateContact(formatted)
      
      if (!validation.valid) {
        toast({
          title: 'Invalid Contact',
          description: validation.message,
          variant: 'destructive',
        })
        return
      }

      // Send OTP using Next.js API route
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contact: formatted }),
      })

      const result = await response.json()

      if (result.success) {
        setContact(formatted)
        setStep('otp')
        toast({
          title: 'OTP Sent',
          description: result.message,
        })
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error sending OTP:', error)
      toast({
        title: 'Error',
        description: 'Failed to send OTP. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Use NextAuth signIn with credentials
      const result = await signIn('otp', {
        contact,
        otp,
        redirect: false,
      })

      if (result?.error) {
        toast({
          title: 'Verification Failed',
          description: result.error,
          variant: 'destructive',
        })
      } else if (result?.ok) {
        toast({
          title: 'Success',
          description: 'Successfully logged in!',
        })
        // NextAuth will handle the redirect
        window.location.href = '/dashboard'
      }
    } catch (error) {
      console.error('Error verifying OTP:', error)
      toast({
        title: 'Error',
        description: 'Failed to verify OTP. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold">Welcome to Spaces</CardTitle>
          <p className="text-muted-foreground">Connect, collaborate, and learn together</p>
        </CardHeader>
        <CardContent>
          {step === 'contact' ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <Label htmlFor="contact">Email or Phone Number</Label>
                <Input
                  id="contact"
                  type="text"
                  placeholder="Enter email or phone number"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Verification Code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setStep('contact')}
              >
                Back
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}