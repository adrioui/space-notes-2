'use client'

import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { OptimisticMessageUtils, type OptimisticMessage } from '@/types/optimistic-message'

/**
 * Hook for managing optimistic messaging operations
 */
export function useOptimisticMessaging(spaceId: string) {
  const queryClient = useQueryClient()

  // Helper function to update message delivery state
  const updateMessageState = useCallback((
    tempId: string, 
    state: 'sending' | 'sent' | 'failed' | 'confirmed',
    error?: string,
    realId?: string
  ) => {
    queryClient.setQueryData(
      ['/api/spaces', spaceId, 'messages'],
      (old: OptimisticMessage[] = []) => {
        return old.map(msg => {
          if (msg.id === tempId || msg._optimistic?.tempId === tempId) {
            return OptimisticMessageUtils.updateDeliveryState(msg, state, error, realId)
          }
          return msg
        })
      }
    )
  }, [queryClient, spaceId])

  // Helper function to remove optimistic message
  const removeOptimisticMessage = useCallback((tempId: string) => {
    console.log('🧹 Removing optimistic message:', tempId)
    queryClient.setQueryData(
      ['/api/spaces', spaceId, 'messages'],
      (old: OptimisticMessage[] = []) => {
        return old.filter(msg => 
          msg.id !== tempId && msg._optimistic?.tempId !== tempId
        )
      }
    )
  }, [queryClient, spaceId])

  // Helper function to add optimistic message to cache
  const addOptimisticMessage = useCallback((optimisticMessage: OptimisticMessage) => {
    console.log('⚡ Adding optimistic message to cache:', optimisticMessage.id)
    console.log('📊 Current cache key:', ['/api/spaces', spaceId, 'messages'])

    queryClient.setQueryData(
      ['/api/spaces', spaceId, 'messages'],
      (old: OptimisticMessage[] = []) => {
        console.log('📋 Current messages in cache:', old.length)

        // Remove any existing optimistic message with same temp ID (in case of retry)
        const filtered = old.filter(msg =>
          !OptimisticMessageUtils.isSameMessage(msg, optimisticMessage)
        )

        const newMessages = OptimisticMessageUtils.sortMessages([...filtered, optimisticMessage])
        console.log('📝 Updated messages count:', newMessages.length)
        console.log('🆕 New message added:', optimisticMessage.id, optimisticMessage.content)

        return newMessages
      }
    )

    // Verify the cache was updated
    const updatedCache = queryClient.getQueryData(['/api/spaces', spaceId, 'messages'])
    console.log('✅ Cache verification - messages count:', (updatedCache as any[])?.length || 0)
  }, [queryClient, spaceId])

  // Get failed messages for retry functionality
  const getFailedMessages = useCallback((): OptimisticMessage[] => {
    const messages = queryClient.getQueryData<OptimisticMessage[]>(['/api/spaces', spaceId, 'messages']) || []
    return messages.filter(OptimisticMessageUtils.isFailed)
  }, [queryClient, spaceId])

  // Get message by ID
  const getMessage = useCallback((messageId: string): OptimisticMessage | undefined => {
    const messages = queryClient.getQueryData<OptimisticMessage[]>(['/api/spaces', spaceId, 'messages']) || []
    return messages.find(msg => msg.id === messageId || msg._optimistic?.tempId === messageId)
  }, [queryClient, spaceId])

  return {
    updateMessageState,
    removeOptimisticMessage,
    addOptimisticMessage,
    getFailedMessages,
    getMessage,
  }
}
