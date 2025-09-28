'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'

const joinSpaceSchema = z.object({
  inviteCode: z.string()
    .min(1, 'Invite code is required')
    .regex(/^[A-Za-z0-9]+$/, 'Invalid invite code format')
    .toUpperCase(),
})

type JoinSpaceForm = z.infer<typeof joinSpaceSchema>

interface JoinSpaceClientProps {
  isOpen: boolean
  onClose: () => void
}

export default function JoinSpaceClient({ isOpen, onClose }: JoinSpaceClientProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  const form = useForm<JoinSpaceForm>({
    resolver: zodResolver(joinSpaceSchema),
    defaultValues: {
      inviteCode: '',
    },
  })

  const joinSpaceMutation = useMutation({
    mutationFn: async (data: JoinSpaceForm) => {
      const response = await fetch(`/api/spaces/join/${data.inviteCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to join space' }))
        throw new Error(error.message || 'Failed to join space')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/spaces'] })
      toast({
        title: 'Joined Space',
        description: `Successfully joined "${data.space?.name || 'the space'}"!`,
      })
      form.reset()
      onClose()
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to Join Space',
        description: error.message,
      })
    },
  })

  const onSubmit = (data: JoinSpaceForm) => {
    joinSpaceMutation.mutate(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join a Space</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Enter an invite code to join an existing space. Ask the space organizer for their invite code.
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="inviteCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invite Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. ABC123"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        className="text-center text-lg font-mono tracking-widest"
                        data-testid="input-invite-code"
                      />
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
                  disabled={joinSpaceMutation.isPending}
                  data-testid="button-join-space-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={joinSpaceMutation.isPending}
                  data-testid="button-join-space-submit"
                >
                  {joinSpaceMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Joining...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sign-in-alt mr-2"></i>
                      Join Space
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}