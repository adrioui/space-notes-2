import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { completeProfile } from '@/lib/auth';
import { useAuth } from '@/hooks/use-auth';
import EmojiAvatar from '@/components/ui/emoji-avatar';

const profileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface ProfileSetupProps {
  contact: string;
  onComplete: () => void;
}

const EMOJI_OPTIONS = ['🌟', '👨‍💻', '👩‍💻', '🎨', '🚀', '💡', '🎯', '🔥', '✨', '💪'];
const BG_COLORS = [
  'hsl(262.1 83.3% 77.8%)', // purple
  'hsl(197 92% 81%)', // blue
  'hsl(120 60% 75%)', // green
  'hsl(45 90% 75%)', // yellow
  'hsl(0 75% 75%)', // red
  'hsl(300 50% 75%)', // pink
];

export default function ProfileSetup({ contact, onComplete }: ProfileSetupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState('🌟');
  const [selectedBgColor, setSelectedBgColor] = useState(BG_COLORS[0]);
  const { toast } = useToast();
  const { setUser } = useAuth();

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      username: '',
      email: contact.includes('@') ? contact : undefined,
      phone: contact.includes('@') ? undefined : contact,
    },
  });

  const handleSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    try {
      const profileData = {
        ...data,
        avatarType: 'emoji' as const,
        avatarData: {
          emoji: selectedEmoji,
          backgroundColor: selectedBgColor,
        },
      };

      const result = await completeProfile(profileData);
      setUser(result.user);
      toast({
        title: 'Profile Created',
        description: 'Welcome to Spaces! Your profile has been set up successfully.',
      });
      onComplete();
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

  return (
    <Card className="w-full max-w-md mx-4">
      <CardContent className="pt-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-foreground">Complete Your Profile</h2>
          <p className="text-muted-foreground mt-2">Let's set up your account</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Avatar Selection */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <EmojiAvatar 
                  emoji={selectedEmoji}
                  backgroundColor={selectedBgColor}
                  size="large"
                />
              </div>
              
              {/* Emoji Selection */}
              <div>
                <p className="text-sm font-medium mb-2">Choose Avatar</p>
                <div className="grid grid-cols-5 gap-2 justify-center">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg hover:border-primary ${
                        selectedEmoji === emoji ? 'border-primary bg-primary/10' : 'border-border'
                      }`}
                      onClick={() => setSelectedEmoji(emoji)}
                      data-testid={`emoji-${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Color Selection */}
              <div>
                <p className="text-sm font-medium mb-2">Background Color</p>
                <div className="flex justify-center space-x-2">
                  {BG_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        selectedBgColor === color ? 'border-foreground' : 'border-border'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedBgColor(color)}
                      data-testid={`bg-color-${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your display name" {...field} data-testid="input-display-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} data-testid="input-username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              data-testid="button-complete-profile"
            >
              {isLoading ? 'Creating Profile...' : 'Complete Setup'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
