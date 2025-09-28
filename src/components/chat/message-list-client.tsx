'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'
import EmojiAvatar from '@/components/ui/emoji-avatar'
import { useSpaceMessages } from '@/hooks/use-supabase'
import type { Message, User } from '@shared/schema'

interface MessageListClientProps {
  spaceId: string
}

export default function MessageListClient({ spaceId }: MessageListClientProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const { data: messages = [] } = useQuery<(Message & { user: User })[]>({
    queryKey: ['/api/spaces', spaceId, 'messages'],
    enabled: !!spaceId,
    refetchInterval: 30000, // Reduced polling as backup to realtime
  })

  // Handle real-time message updates
  const handleNewMessage = useCallback((payload: any) => {
    console.log('Real-time message received:', payload)
    // Safely refetch messages when new message arrives, with debouncing
    setTimeout(() => {
      queryClient.refetchQueries({ 
        queryKey: ['/api/spaces', spaceId, 'messages'],
        exact: true
      })
    }, 100) // 100ms debounce to prevent excessive fetches
  }, [queryClient, spaceId])

  const handleError = useCallback((error: any) => {
    console.error('Supabase Realtime error:', error)
  }, [])

  // Subscribe to real-time messages for this space
  useSpaceMessages(spaceId, handleNewMessage, handleError)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-comment text-4xl text-muted-foreground mb-4"></i>
          <h3 className="text-lg font-medium text-foreground mb-2">No messages yet</h3>
          <p className="text-muted-foreground">Be the first to start the conversation!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const avatarData = message.user.avatarData as { emoji: string; backgroundColor: string } | null

        return (
          <div key={message.id} className="flex space-x-3" data-testid={`message-${message.id}`}>
            {avatarData ? (
              <EmojiAvatar
                emoji={avatarData.emoji}
                backgroundColor={avatarData.backgroundColor}
                size="small"
              />
            ) : (
              <div className="w-8 h-8 bg-muted-foreground rounded-full flex items-center justify-center">
                <i className="fas fa-user text-background text-xs"></i>
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium text-foreground" data-testid="message-author">
                  {message.user.displayName}
                </span>
                <span className="text-xs text-muted-foreground" data-testid="message-time">
                  {message.createdAt ? formatTime(message.createdAt) : ''}
                </span>
              </div>
              
              {message.messageType === 'text' && (
                <p className="text-foreground break-words" data-testid="message-content">
                  {message.content}
                </p>
              )}
              
              {message.messageType === 'image' && message.attachments && Array.isArray(message.attachments) && 
                <div className="space-y-2">
                  {message.content && (
                    <p className="text-foreground break-words">{message.content}</p>
                  )}
                  {(message.attachments as any[]).map((attachment: any, index: number) => (
                    <img
                      key={index}
                      src={attachment.url}
                      alt={attachment.name || 'Image'}
                      className="max-w-sm rounded-lg border border-border"
                      data-testid={`message-image-${index}`}
                    />
                  ))}
                </div>
              }
              
              {message.messageType === 'system' && (
                <p className="text-muted-foreground italic text-sm">
                  {message.content}
                </p>
              )}
            </div>
          </div>
        )
      })}
      <div ref={messagesEndRef} />
    </div>
  )
}