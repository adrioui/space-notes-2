/**
 * Types for optimistic messaging system
 */

export type MessageDeliveryState = 
  | 'sending'     // Message is being sent to server
  | 'sent'        // Message successfully sent and confirmed by server
  | 'failed'      // Message failed to send
  | 'confirmed'   // Message confirmed via postgres_changes (real-time)

export interface OptimisticMessageMetadata {
  deliveryState: MessageDeliveryState
  tempId?: string           // Temporary ID for optimistic messages
  realId?: string          // Real ID once confirmed by server
  error?: string           // Error message if delivery failed
  timestamp: number        // Timestamp for ordering and deduplication
  retryCount?: number      // Number of retry attempts
}

export interface OptimisticMessage {
  id: string
  spaceId: string
  userId: string
  content: string
  messageType: 'text' | 'image' | 'system'
  attachments: any[] | null
  createdAt: string
  user: {
    id: string
    displayName: string
    username: string
    avatarType: string
    avatarData: any
  }
  // Optimistic messaging metadata
  _optimistic?: OptimisticMessageMetadata
}

/**
 * Utility functions for optimistic messaging
 */
export class OptimisticMessageUtils {
  /**
   * Generate a unique temporary ID for optimistic messages
   */
  static generateTempId(): string {
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Check if a message is optimistic (has temporary ID)
   */
  static isOptimistic(message: OptimisticMessage): boolean {
    return message.id.startsWith('temp-') || !!message._optimistic?.tempId
  }

  /**
   * Check if a message is in sending state
   */
  static isSending(message: OptimisticMessage): boolean {
    return message._optimistic?.deliveryState === 'sending'
  }

  /**
   * Check if a message failed to send
   */
  static isFailed(message: OptimisticMessage): boolean {
    return message._optimistic?.deliveryState === 'failed'
  }

  /**
   * Check if a message is confirmed (real-time received)
   */
  static isConfirmed(message: OptimisticMessage): boolean {
    return message._optimistic?.deliveryState === 'confirmed' || !message._optimistic
  }

  /**
   * Create an optimistic message for immediate UI display
   */
  static createOptimisticMessage(
    content: string,
    spaceId: string,
    user: any,
    messageType: 'text' | 'image' = 'text',
    attachments: any[] | null = null
  ): OptimisticMessage {
    const tempId = this.generateTempId()
    const timestamp = Date.now()

    return {
      id: tempId,
      spaceId,
      userId: user.id,
      content: content.trim(),
      messageType,
      attachments,
      createdAt: new Date(timestamp).toISOString(),
      user: {
        id: user.id,
        displayName: user.name || 'Unknown User',
        username: user.email || '',
        avatarType: user.avatarType || 'emoji',
        avatarData: user.avatarData || { emoji: '👤', backgroundColor: '#6366f1' },
      },
      _optimistic: {
        deliveryState: 'sending',
        tempId,
        timestamp,
        retryCount: 0,
      },
    }
  }

  /**
   * Update message delivery state
   */
  static updateDeliveryState(
    message: OptimisticMessage,
    state: MessageDeliveryState,
    error?: string,
    realId?: string
  ): OptimisticMessage {
    return {
      ...message,
      id: realId || message.id,
      _optimistic: {
        ...message._optimistic!,
        deliveryState: state,
        error,
        realId,
      },
    }
  }

  /**
   * Convert optimistic message to confirmed message
   */
  static confirmMessage(
    optimisticMessage: OptimisticMessage,
    confirmedMessage: any
  ): OptimisticMessage {
    return {
      ...confirmedMessage,
      _optimistic: {
        ...optimisticMessage._optimistic!,
        deliveryState: 'confirmed',
        realId: confirmedMessage.id,
      },
    }
  }

  /**
   * Check if two messages are the same (for deduplication)
   */
  static isSameMessage(msg1: OptimisticMessage, msg2: OptimisticMessage): boolean {
    // Check by real ID first
    if (msg1._optimistic?.realId && msg2._optimistic?.realId) {
      return msg1._optimistic.realId === msg2._optimistic.realId
    }
    
    // Check by temp ID
    if (msg1._optimistic?.tempId && msg2._optimistic?.tempId) {
      return msg1._optimistic.tempId === msg2._optimistic.tempId
    }
    
    // Check by regular ID
    return msg1.id === msg2.id
  }

  /**
   * Sort messages by timestamp (optimistic messages first, then by creation time)
   */
  static sortMessages(messages: OptimisticMessage[]): OptimisticMessage[] {
    return messages.sort((a, b) => {
      const aTime = a._optimistic?.timestamp || new Date(a.createdAt).getTime()
      const bTime = b._optimistic?.timestamp || new Date(b.createdAt).getTime()
      return aTime - bTime
    })
  }
}
