'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

interface MessageInputClientProps {
  spaceId: string
}

export default function MessageInputClient({ spaceId }: MessageInputClientProps) {
  const [message, setMessage] = useState('')
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/spaces/${spaceId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, messageType: 'text' }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to send message')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spaces', spaceId, 'messages'] })
      setMessage('')
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="flex space-x-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={sendMessageMutation.isPending}
          className="flex-1"
          data-testid="input-message"
        />
        <Button
          type="submit"
          disabled={!message.trim() || sendMessageMutation.isPending}
          data-testid="button-send-message"
        >
          {sendMessageMutation.isPending ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <i className="fas fa-paper-plane"></i>
          )}
        </Button>
      </div>
    </form>
  )
}