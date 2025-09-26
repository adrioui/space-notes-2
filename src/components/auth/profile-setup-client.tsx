'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import EmojiAvatar from '@/components/ui/emoji-avatar'

const profileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  avatarType: z.literal('emoji').default('emoji'),
  avatarData: z.object({
    emoji: z.string().default('😀'),
    backgroundColor: z.string().default('blue'),
  }),
})

type ProfileForm = z.infer<typeof profileSchema>

interface ProfileSetupClientProps {
  contact: string
  onComplete: () => void
}

const emojis = ['😀', '😊', '😎', '🤗', '🥳', '🚀', '💡', '🎨', '🌟', '🔥', '💪', '🎯']
const colors = ['blue', 'green', 'purple', 'pink', 'orange', 'red', 'indigo', 'cyan']

export default function ProfileSetupClient({ contact, onComplete }: ProfileSetupClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  
  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      username: '',
      avatarType: 'emoji',
      avatarData: {
        emoji: '😀',
        backgroundColor: 'blue',
      },
    },
  })

  const handleSubmit = async (data: ProfileForm) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create profile')
      }
      
      toast({
        title: 'Profile Created',
        description: 'Welcome to Spaces! Your account has been set up.',
      })
      
      onComplete()
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

  const avatarData = form.watch('avatarData')

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">Complete Your Profile</CardTitle>
        <p className="text-center text-muted-foreground">
          Set up your profile to get started with Spaces
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Avatar Preview */}
            <div className="flex justify-center">
              <EmojiAvatar
                emoji={avatarData.emoji}
                backgroundColor={avatarData.backgroundColor}
                size="large"
              />
            </div>

            {/* Emoji Selection */}
            <FormField
              control={form.control}
              name="avatarData.emoji"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Choose your avatar</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-6 gap-2">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className={`p-2 text-2xl rounded-lg border hover:bg-muted ${
                            field.value === emoji 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border'
                          }`}
                          onClick={() => field.onChange(emoji)}
                          data-testid={`emoji-${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Background Color Selection */}
            <FormField
              control={form.control}
              name="avatarData.backgroundColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Background color</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 ${
                            field.value === color 
                              ? 'border-foreground' 
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: `hsl(var(--${color}))` }}
                          onClick={() => field.onChange(color)}
                          data-testid={`color-${color}`}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Display Name */}
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Your full name"
                      disabled={isLoading}
                      data-testid="input-display-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Username */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="your_username"
                      disabled={isLoading}
                      data-testid="input-username"
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
              data-testid="button-complete-profile"
            >
              {isLoading ? 'Creating Profile...' : 'Complete Profile'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}