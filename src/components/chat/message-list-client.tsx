'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import EmojiAvatar from '@/components/ui/emoji-avatar'
import { useSpaceMessages, useSpaceBroadcast } from '@/hooks/use-supabase'
import { useChannelConnection } from '@/hooks/use-realtime-connection'
import { ConnectionIndicator } from '@/components/ui/connection-status'
import type { Message, User } from '@shared/schema'
import { OptimisticMessageUtils, type OptimisticMessage } from '@/types/optimistic-message'

interface MessageListClientProps {
  spaceId: string
}

export default function MessageListClient({ spaceId }: MessageListClientProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  // Track processed message IDs to prevent duplicates
  const processedMessageIds = useRef<Set<string>>(new Set())

  // Monitor connection status for this space's channels
  const messagesChannelName = `space:${spaceId}:messages`
  const broadcastChannelName = `space:${spaceId}:broadcast`
  const messagesConnection = useChannelConnection(messagesChannelName)
  const broadcastConnection = useChannelConnection(broadcastChannelName)

  const { data: rawMessages = [] } = useQuery<any[]>({
    queryKey: ['/api/spaces', spaceId, 'messages'],
    enabled: !!spaceId,
    refetchInterval: 60000, // Reduced polling frequency since we have real-time updates
    staleTime: 30000, // Consider data fresh for 30 seconds
  })

  // Convert raw messages to OptimisticMessage format
  const messages: OptimisticMessage[] = rawMessages.map((msg: any) => ({
    ...msg,
    _optimistic: {
      deliveryState: 'confirmed' as const,
      timestamp: new Date(msg.createdAt).getTime(),
      realId: msg.id,
    }
  }))

  // Helper function to safely add message with deduplication and optimistic handling
  const addMessageToCache = useCallback((newMessage: any, source: string) => {
    const messageId = newMessage.id

    // Skip if we've already processed this message
    if (processedMessageIds.current.has(messageId)) {
      console.log(`🔄 Message ${messageId} already processed from ${source}, skipping duplicate`)
      return false
    }

    // Mark as processed
    processedMessageIds.current.add(messageId)

    queryClient.setQueryData(
      ['/api/spaces', spaceId, 'messages'],
      (old: OptimisticMessage[] = []) => {
        // Check if this is a confirmation of an optimistic message
        const optimisticIndex = old.findIndex(msg => {
          // Match by real ID if the optimistic message has one
          if (msg._optimistic?.realId === messageId) {
            return true
          }
          // Match by content and user for messages that might not have real ID yet
          if (OptimisticMessageUtils.isOptimistic(msg) &&
              msg.userId === newMessage.userId &&
              msg.content === newMessage.content &&
              Math.abs(new Date(msg.createdAt).getTime() - new Date(newMessage.createdAt).getTime()) < 10000) {
            return true
          }
          return false
        })

        if (optimisticIndex !== -1) {
          // Replace optimistic message with confirmed message
          const optimisticMessage = old[optimisticIndex]
          const confirmedMessage = OptimisticMessageUtils.confirmMessage(optimisticMessage, newMessage)
          console.log(`✅ Confirmed optimistic message ${optimisticMessage.id} -> ${messageId}`)

          // Also mark the real ID as processed to prevent future duplicates
          processedMessageIds.current.add(messageId)

          const updated = [...old]
          updated[optimisticIndex] = confirmedMessage
          return OptimisticMessageUtils.sortMessages(updated)
        }

        // Check for regular duplicates
        const exists = old.some(msg => msg.id === messageId)
        if (exists) {
          console.log(`🔄 Message ${messageId} already exists in cache, skipping duplicate`)
          return old
        }

        // Add new message
        console.log(`✅ Adding new message ${messageId} to cache from ${source}`)
        const messageWithOptimistic: OptimisticMessage = {
          ...newMessage,
          _optimistic: {
            deliveryState: 'confirmed',
            timestamp: new Date(newMessage.createdAt).getTime(),
            realId: messageId,
          }
        }

        return OptimisticMessageUtils.sortMessages([...old, messageWithOptimistic])
      }
    )

    return true
  }, [queryClient, spaceId])

  // Handle real-time message updates - ONLY for postgres changes
  const handleNewMessage = useCallback((payload: any) => {
    console.log('📡 Real-time postgres event received:', payload)

    // Only handle postgres changes (INSERT/UPDATE/DELETE from database)
    if (payload.eventType === 'INSERT') {
      console.log('📊 Database INSERT detected, processing message')

      // Use deduplication helper to add message
      addMessageToCache(payload.new, 'postgres_changes')

    } else if (payload.eventType === 'UPDATE') {
      console.log('📊 Database UPDATE detected, updating message in cache')

      // Update existing message in cache
      queryClient.setQueryData(
        ['/api/spaces', spaceId, 'messages'],
        (old: any[]) => {
          if (!old) return []
          return old.map(msg =>
            msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
          )
        }
      )
    }
    // Note: We don't handle broadcast events here anymore to avoid duplication
  }, [addMessageToCache, queryClient, spaceId])

  const handleError = useCallback((error: any) => {
    console.error('Supabase Realtime error:', error)
  }, [])

  // Subscribe to real-time messages for this space
  useSpaceMessages(spaceId, handleNewMessage, handleError)

  // Handle broadcast events for non-message real-time features
  const handleBroadcast = useCallback((event: string, payload: any) => {
    console.log(`📢 Broadcast event received: ${event}`, payload)

    switch (event) {
      case 'user_typing':
        // Handle typing indicators (future feature)
        console.log('⌨️ User typing event:', payload)
        break

      case 'message_reaction':
        // Handle message reactions (future feature)
        console.log('👍 Message reaction event:', payload)
        break

      default:
        console.log(`❓ Unknown broadcast event: ${event}`)
    }
  }, [spaceId])

  // Subscribe to broadcast events for immediate updates
  useSpaceBroadcast(spaceId, handleBroadcast, handleError)

  // Reset processed message IDs when space changes
  useEffect(() => {
    processedMessageIds.current.clear()
    console.log(`🧹 Cleared processed message IDs for space: ${spaceId}`)
  }, [spaceId])

  // Cleanup failed messages on unmount (optional - for better UX)
  useEffect(() => {
    return () => {
      // Clean up any failed optimistic messages when component unmounts
      queryClient.setQueryData(
        ['/api/spaces', spaceId, 'messages'],
        (old: OptimisticMessage[] = []) => {
          const cleaned = old.filter(msg => !OptimisticMessageUtils.isFailed(msg))
          if (cleaned.length !== old.length) {
            console.log('🧹 Cleaned up failed optimistic messages on unmount')
          }
          return cleaned
        }
      )
    }
  }, [queryClient, spaceId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Debug: Log when messages change
  useEffect(() => {
    console.log('📊 Messages updated in MessageList:', messages.length)
    console.log('📋 Current messages:', messages.map(m => ({
      id: m.id,
      content: m.content.substring(0, 50),
      state: m._optimistic?.deliveryState
    })))

    // Also log raw messages from cache
    const cacheData = queryClient.getQueryData(['/api/spaces', spaceId, 'messages'])
    console.log('🗄️ Raw cache data:', cacheData)
  }, [messages, queryClient, spaceId])

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

        // Determine message styling based on delivery state
        const messageClasses = [
          "flex space-x-3 transition-opacity duration-200",
          OptimisticMessageUtils.isSending(message) && "opacity-70",
          OptimisticMessageUtils.isFailed(message) && "opacity-50 bg-red-50 dark:bg-red-900/10 rounded-lg p-2 -m-2",
        ].filter(Boolean).join(" ")

        return (
          <div key={message.id} className={messageClasses} data-testid={`message-${message.id}`}>
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

                {/* Delivery status indicator */}
                {message._optimistic && (
                  <span className="text-xs flex items-center space-x-1">
                    {OptimisticMessageUtils.isSending(message) && (
                      <>
                        <i className="fas fa-spinner fa-spin text-blue-500" title="Sending..."></i>
                        <span className="text-blue-500">Sending...</span>
                      </>
                    )}
                    {message._optimistic.deliveryState === 'sent' && (
                      <>
                        <i className="fas fa-check text-green-500" title="Sent"></i>
                        <span className="text-green-500">Sent</span>
                      </>
                    )}
                    {OptimisticMessageUtils.isFailed(message) && (
                      <>
                        <i className="fas fa-exclamation-triangle text-red-500" title="Failed to send"></i>
                        <span className="text-red-500">Failed</span>
                        <button
                          onClick={() => {
                            // Call the global retry function
                            const retryFn = (window as any)[`retryMessage_${spaceId}`]
                            if (retryFn) {
                              retryFn(message.id)
                            } else {
                              console.warn('Retry function not available')
                            }
                          }}
                          className="text-xs text-blue-500 hover:text-blue-700 underline ml-1"
                          title="Retry sending message"
                        >
                          Retry
                        </button>
                      </>
                    )}
                    {OptimisticMessageUtils.isConfirmed(message) && !OptimisticMessageUtils.isOptimistic(message) && (
                      <i className="fas fa-check-double text-green-600" title="Delivered"></i>
                    )}
                  </span>
                )}
              </div>
              
              {message.messageType === 'text' && (
                <p className="text-foreground break-words" data-testid="message-content">
                  {message.content}
                </p>
              )}
              
              {message.messageType === 'image' && message.attachments && Array.isArray(message.attachments) ? (
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
              ) : null}
              
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

      {/* Connection status indicator (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-20 left-4 z-40">
          <div className="bg-black/80 text-white p-2 rounded text-xs space-y-1">
            <div>Messages: <ConnectionIndicator /></div>
            <div className="text-xs text-gray-300">
              {messagesConnection.isConnected ? '🟢' : '🔴'} Messages Channel
            </div>
            <div className="text-xs text-gray-300">
              {broadcastConnection.isConnected ? '🟢' : '🔴'} Broadcast Channel
            </div>
          </div>
        </div>
      )}
    </div>
  )
}