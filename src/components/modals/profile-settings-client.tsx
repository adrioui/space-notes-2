'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import EmojiAvatar from '@/components/ui/emoji-avatar'

const profileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  avatarData: z.object({
    emoji: z.string(),
    backgroundColor: z.string(),
  }),
})

type ProfileForm = z.infer<typeof profileSchema>

interface ProfileSettingsClientProps {
  isOpen: boolean
  onClose: () => void
}

const emojis = ['😀', '😊', '😎', '🤗', '🥳', '🚀', '💡', '🎨', '🌟', '🔥', '💪', '🎯']
const colors = ['blue', 'green', 'purple', 'pink', 'orange', 'red', 'indigo', 'cyan']

export default function ProfileSettingsClient({ isOpen, onClose }: ProfileSettingsClientProps) {
  const { data: session, update } = useSession()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  const user = session?.user as any
  
  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || user?.name || '',
      username: user?.username || '',
      avatarData: user?.avatarData || {
        emoji: '😀',
        backgroundColor: 'blue',
      },
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update profile')
      }
      
      return response.json()
    },
    onSuccess: async (updatedUser) => {
      await update({ 
        ...session, 
        user: { ...session?.user, ...updatedUser } 
      })
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] })
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      })
      onClose()
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      })
    },
  })

  const handleSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data)
  }

  const avatarData = form.watch('avatarData')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
        </DialogHeader>
        
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
                  <FormLabel>Avatar</FormLabel>
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

            {/* Background Color */}
            <FormField
              control={form.control}
              name="avatarData.backgroundColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Background Color</FormLabel>
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
                    <Input {...field} disabled={updateProfileMutation.isPending} />
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
                    <Input {...field} disabled={updateProfileMutation.isPending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updateProfileMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}