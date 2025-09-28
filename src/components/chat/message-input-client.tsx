'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useSupabaseStorage, useSupabaseRealtime } from '@/hooks/use-supabase'
import { useSession } from 'next-auth/react'
import { OptimisticMessageUtils, type OptimisticMessage } from '@/types/optimistic-message'
import { useOptimisticMessaging } from '@/hooks/use-optimistic-messaging'

interface MessageInputClientProps {
  spaceId: string
}

export default function MessageInputClient({ spaceId }: MessageInputClientProps) {
  const [message, setMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const storageManager = useSupabaseStorage()
  const realtime = useSupabaseRealtime()
  const { data: session } = useSession()
  const {
    updateMessageState,
    removeOptimisticMessage,
    addOptimisticMessage,
    getMessage
  } = useOptimisticMessaging(spaceId)

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, file, tempId }: { content: string; file?: File; tempId: string }) => {
      // Update optimistic message to sending state
      updateMessageState(tempId, 'sending')

      let messageType: 'text' | 'image' = 'text'
      let attachments: Array<{ type: string; url: string; name: string; path: string }> | null = null

      // If there's a file, upload it first
      if (file) {
        setUploading(true)
        try {
          // Use the temp ID for the upload path to maintain consistency
          const uploadResult = await storageManager.uploadAttachment(file, spaceId, tempId)

          messageType = 'image'
          attachments = [{
            type: file.type.startsWith('image/') ? 'image' : 'file',
            url: uploadResult.url,
            name: file.name,
            path: uploadResult.path
          }]

          // Update optimistic message with attachment info
          queryClient.setQueryData(
            ['/api/spaces', spaceId, 'messages'],
            (old: OptimisticMessage[] = []) => {
              return old.map(msg => {
                if (msg.id === tempId || msg._optimistic?.tempId === tempId) {
                  return {
                    ...msg,
                    messageType,
                    attachments,
                    content: content.trim() || `Shared ${file.name}`
                  }
                }
                return msg
              })
            }
          )
        } catch (error) {
          setUploading(false)
          throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
        setUploading(false)
      }

      // Send message to server
      const response = await fetch(`/api/spaces/${spaceId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim() || (file ? `Shared ${file.name}` : ''),
          messageType,
          attachments
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to send message: ${errorText}`)
      }

      const serverMessage = await response.json()

      // Update optimistic message to sent state with real ID
      updateMessageState(tempId, 'sent', undefined, serverMessage.id)

      return { serverMessage, tempId }
    },
    onSuccess: ({ serverMessage, tempId }) => {
      console.log('✅ Message sent successfully:', serverMessage.id)

      // Clear form immediately on success
      setMessage('')
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // The optimistic message will be replaced by postgres_changes subscription
      // We keep it in 'sent' state until postgres_changes confirms it
      console.log('📡 Waiting for postgres_changes confirmation for message:', serverMessage.id)
    },
    onError: (error: Error, variables) => {
      console.error('❌ Failed to send message:', error)

      const { tempId } = variables as { tempId: string }

      // Update optimistic message to failed state
      updateMessageState(tempId, 'failed', error.message)

      // Show error toast
      toast({
        variant: 'destructive',
        title: 'Failed to send message',
        description: error.message,
      })

      // Don't clear form on error - let user retry
      console.log('💡 Message marked as failed. User can retry sending.')
    },
  })

  // Create a retry function that can be called from message list
  const retryFailedMessage = useCallback((messageId: string) => {
    const failedMessage = getMessage(messageId)
    if (!failedMessage?._optimistic || !session?.user) return

    console.log('🔄 Retrying failed message:', failedMessage.id)

    // Update message to sending state
    updateMessageState(failedMessage.id, 'sending')

    // Retry sending the message
    sendMessageMutation.mutate({
      content: failedMessage.content,
      file: undefined, // TODO: Handle file retry if needed
      tempId: failedMessage.id
    })
  }, [getMessage, session?.user, updateMessageState, sendMessageMutation])

  // Expose retry function globally for message list to use
  React.useEffect(() => {
    (window as any)[`retryMessage_${spaceId}`] = retryFailedMessage

    return () => {
      delete (window as any)[`retryMessage_${spaceId}`]
    }
  }, [spaceId, retryFailedMessage])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please select a file smaller than 10MB.',
        })
        return
      }
      setSelectedFile(file)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Debug function to test optimistic messaging
  const testOptimisticMessage = () => {
    if (!session?.user) {
      console.log('❌ No user session for test')
      return
    }

    console.log('🧪 Testing optimistic message creation...')
    const testMessage = OptimisticMessageUtils.createOptimisticMessage(
      'Test optimistic message',
      spaceId,
      session.user,
      'text'
    )

    console.log('🧪 Test message created:', testMessage)
    addOptimisticMessage(testMessage)
    console.log('🧪 Test message added to cache')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    console.log('🎯 Form submitted!', {
      message: message.trim(),
      selectedFile: !!selectedFile,
      isPending: sendMessageMutation.isPending,
      uploading,
      hasUser: !!session?.user
    })

    if ((!message.trim() && !selectedFile) || sendMessageMutation.isPending || uploading || !session?.user) {
      console.log('❌ Form submission blocked:', {
        noContent: !message.trim() && !selectedFile,
        isPending: sendMessageMutation.isPending,
        uploading,
        noUser: !session?.user
      })
      return
    }

    // Create optimistic message for immediate UI feedback
    const content = message.trim() || (selectedFile ? `Sharing ${selectedFile.name}` : '')
    const messageType: 'text' | 'image' = selectedFile ? 'image' : 'text'

    console.log('🚀 Creating optimistic message:', { content, spaceId, user: session.user, messageType })

    const optimisticMessage = OptimisticMessageUtils.createOptimisticMessage(
      content,
      spaceId,
      session.user,
      messageType,
      selectedFile ? [{
        type: selectedFile.type.startsWith('image/') ? 'image' : 'file',
        url: URL.createObjectURL(selectedFile), // Temporary URL for preview
        name: selectedFile.name,
        path: '' // Will be set after upload
      }] : null
    )

    console.log('⚡ Optimistic message created:', optimisticMessage)

    // Add optimistic message to UI immediately
    console.log('📝 Adding optimistic message to cache...')
    addOptimisticMessage(optimisticMessage)
    console.log('✅ Optimistic message added to cache')

    // Send message to server
    console.log('🚀 Sending message to server:', { content, tempId: optimisticMessage.id })
    sendMessageMutation.mutate({
      content: content,
      file: selectedFile || undefined,
      tempId: optimisticMessage.id
    })

    // Clear form immediately after creating optimistic message
    setMessage('')
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    console.log('🧹 Form cleared after optimistic message creation')
  }

  return (
    <form onSubmit={handleSubmit} className="p-4">
      {/* File preview */}
      {selectedFile && (
        <div className="mb-3 p-2 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <i className="fas fa-paperclip text-muted-foreground"></i>
              <span className="text-sm text-foreground truncate">{selectedFile.name}</span>
              <span className="text-xs text-muted-foreground">
                ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="text-muted-foreground hover:text-foreground"
            >
              <i className="fas fa-times"></i>
            </Button>
          </div>
        </div>
      )}
      
      <div className="flex space-x-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={selectedFile ? "Add a caption..." : "Type a message..."}
          disabled={sendMessageMutation.isPending || uploading}
          className="flex-1"
          data-testid="input-message"
        />
        
        {/* File upload button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
          data-testid="file-input"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={sendMessageMutation.isPending || uploading}
          data-testid="button-attach-file"
        >
          <i className="fas fa-paperclip"></i>
        </Button>
        
        <Button
          type="submit"
          disabled={(!message.trim() && !selectedFile) || sendMessageMutation.isPending || uploading}
          data-testid="button-send-message"
        >
          {sendMessageMutation.isPending || uploading ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <i className="fas fa-paper-plane"></i>
          )}
        </Button>

        {/* Debug button - only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <Button
            type="button"
            onClick={testOptimisticMessage}
            variant="outline"
            className="px-4 ml-2"
          >
            🧪 Test
          </Button>
        )}
      </div>
    </form>
  )
}