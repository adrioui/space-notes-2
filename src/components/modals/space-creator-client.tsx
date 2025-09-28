'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import ErrorBoundary from '@/components/error-boundary'

const spaceSchema = z.object({
  name: z.string().min(1, 'Space name is required'),
  description: z.string().optional(),
  emoji: z.string().default('🚀'),
  wallpaper: z.string().default('neutral'),
})

type SpaceForm = z.infer<typeof spaceSchema>

interface SpaceCreatorClientProps {
  isOpen: boolean
  onClose: () => void
}

const emojis = ['🚀', '💡', '🎨', '📚', '🎯', '🌟', '🔥', '⚡', '🎪', '🌈', '🎭', '🎨']
const wallpapers = [
  { id: 'neutral', name: 'Neutral', preview: 'bg-background' },
  { id: 'growth', name: 'Growth', preview: 'bg-gradient-to-br from-green-50 to-emerald-100' },
  { id: 'creative', name: 'Creative', preview: 'bg-gradient-to-br from-purple-50 to-pink-100' },
]

export default function SpaceCreatorClient({ isOpen, onClose }: SpaceCreatorClientProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  const form = useForm<SpaceForm>({
    resolver: zodResolver(spaceSchema),
    defaultValues: {
      name: '',
      description: '',
      emoji: '🚀',
      wallpaper: 'neutral',
    },
  })

  const createSpaceMutation = useMutation({
    mutationFn: async (data: SpaceForm) => {
      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Please log in again to create a space')
        }

        if (response.status === 409) {
          throw new Error('A space with this name already exists')
        }

        const errorMessage = errorData.message || `Failed to create space (${response.status})`
        throw new Error(errorMessage)
      }

      return response.json()
    },
    retry: (failureCount, error) => {
      // Don't retry on authentication or validation errors
      if (error.message.includes('log in again') || error.message.includes('already exists')) {
        return false
      }
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spaces'] })
      toast({
        title: 'Space Created',
        description: 'Your new space has been created successfully.',
      })
      form.reset()
      onClose()
    },
    onError: (error: Error) => {
      console.error('Space creation error:', error)
      toast({
        variant: 'destructive',
        title: 'Failed to Create Space',
        description: error.message || 'An unexpected error occurred. Please try again.',
      })
    },
  })

  const handleSubmit = (data: SpaceForm) => {
    createSpaceMutation.mutate(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Space</DialogTitle>
        </DialogHeader>
        
        <ErrorBoundary>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Emoji Selection */}
            <FormField
              control={form.control}
              name="emoji"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Space Icon</FormLabel>
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

            {/* Space Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Space Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="My Awesome Space"
                      disabled={createSpaceMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="What's this space about?"
                      disabled={createSpaceMutation.isPending}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Wallpaper */}
            <FormField
              control={form.control}
              name="wallpaper"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wallpaper</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-3 gap-2">
                      {wallpapers.map((wallpaper) => (
                        <button
                          key={wallpaper.id}
                          type="button"
                          className={`p-3 rounded-lg border text-sm ${
                            field.value === wallpaper.id 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border hover:bg-muted'
                          }`}
                          onClick={() => field.onChange(wallpaper.id)}
                        >
                          <div className={`w-full h-8 rounded mb-2 ${wallpaper.preview}`} />
                          {wallpaper.name}
                        </button>
                      ))}
                    </div>
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
                disabled={createSpaceMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createSpaceMutation.isPending}
              >
                {createSpaceMutation.isPending ? 'Creating...' : 'Create Space'}
              </Button>
            </div>
            </form>
          </Form>
        </ErrorBoundary>
      </DialogContent>
    </Dialog>
  )
}