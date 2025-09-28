'use client'

import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useSupabaseStorage } from '@/hooks/use-supabase'

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

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, file }: { content: string; file?: File }) => {
      let messageType = 'text'
      let attachments = null
      
      // If there's a file, upload it first
      if (file) {
        setUploading(true)
        try {
          // Generate a temporary message ID for the upload path
          const tempMessageId = Date.now().toString()
          const uploadResult = await storageManager.uploadAttachment(file, spaceId, tempMessageId)
          
          messageType = 'image'
          attachments = [{
            type: file.type.startsWith('image/') ? 'image' : 'file',
            url: uploadResult.url,
            name: file.name,
            path: uploadResult.path
          }]
        } catch (error) {
          setUploading(false)
          throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
        setUploading(false)
      }
      
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
        throw new Error('Failed to send message')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spaces', spaceId, 'messages'] })
      setMessage('')
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      })
    },
  })

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((message.trim() || selectedFile) && !sendMessageMutation.isPending && !uploading) {
      sendMessageMutation.mutate({ content: message.trim(), file: selectedFile || undefined })
    }
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
      </div>
    </form>
  )
}