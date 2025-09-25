import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { sendOTP, verifyOTP } from '@/lib/auth';
import { useAuth } from '@/hooks/use-auth';
import ProfileSetup from './profile-setup';

const contactSchema = z.object({
  contact: z.string().min(1, 'Please enter your email or phone number'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

type ContactForm = z.infer<typeof contactSchema>;
type OTPForm = z.infer<typeof otpSchema>;

export default function OTPForm() {
  const [step, setStep] = useState<'contact' | 'otp' | 'profile'>('contact');
  const [contact, setContact] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();

  const contactForm = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { contact: '' },
  });

  const otpForm = useForm<OTPForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  const handleSendOTP = async (data: ContactForm) => {
    setIsLoading(true);
    try {
      await sendOTP(data.contact);
      setContact(data.contact);
      setStep('otp');
      toast({
        title: 'OTP Sent',
        description: 'Please check your email or phone for the verification code.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (data: OTPForm) => {
    setIsLoading(true);
    try {
      const result = await verifyOTP(contact, data.otp);
      
      if (result.isNewUser) {
        setStep('profile');
      } else {
        setUser(result.user);
        setLocation('/dashboard');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileComplete = () => {
    setLocation('/dashboard');
  };

  if (step === 'profile') {
    return <ProfileSetup contact={contact} onComplete={handleProfileComplete} />;
  }

  return (
    <Card className="w-full max-w-md mx-4">
      <CardContent className="pt-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 gradient-bg rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-users text-primary-foreground text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome to Spaces</h1>
          <p className="text-muted-foreground mt-2">Connect, collaborate, and learn together</p>
        </div>

        {step === 'contact' ? (
          <Form {...contactForm}>
            <form onSubmit={contactForm.handleSubmit(handleSendOTP)} className="space-y-4">
              <FormField
                control={contactForm.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email or Phone</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter email or phone number" 
                        {...field} 
                        data-testid="input-contact"
                      />
                    </FormControl>
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
                {isLoading ? 'Sending...' : 'Send OTP Code'}
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(handleVerifyOTP)} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code sent to
                </p>
                <p className="font-medium">{contact}</p>
              </div>
              
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
                onClick={() => setStep('contact')}
                data-testid="button-back"
              >
                Back
              </Button>
            </form>
          </Form>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            By continuing, you agree to our Terms of Service
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
