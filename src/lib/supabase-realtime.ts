'use client'

import { supabase } from './supabase'
import type { RealtimeChannel, RealtimeChannelSendResponse } from '@supabase/supabase-js'

interface ChannelState {
  channel: RealtimeChannel
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  retryCount: number
  lastError?: Error
  onError?: (error: any) => void
}

export class SupabaseRealtimeManager {
  private channels: Map<string, ChannelState> = new Map()
  private maxRetries = 3
  private baseRetryDelay = 1000 // 1 second

  // Subscribe to space messages with enhanced error handling
  subscribeToSpaceMessages(
    spaceId: string,
    onMessage: (payload: any) => void,
    onError?: (error: any) => void
  ) {
    const channelName = `space:${spaceId}:messages`

    return this.createSubscription(
      channelName,
      (channel) => {
        return channel
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `space_id=eq.${spaceId}`,
            },
            (payload) => {
              console.log('📨 New message received:', payload)
              onMessage(payload)
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'messages',
              filter: `space_id=eq.${spaceId}`,
            },
            (payload) => {
              console.log('📝 Message updated:', payload)
              onMessage(payload)
            }
          )
      },
      onError
    )
  }

  // Generic subscription creation with retry logic
  private createSubscription(
    channelName: string,
    setupChannel: (channel: RealtimeChannel) => RealtimeChannel,
    onError?: (error: any) => void
  ): string {
    // Clean up existing subscription
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName)
    }

    const attemptSubscription = (retryCount = 0): void => {
      console.log(`🔄 Attempting subscription to ${channelName} (attempt ${retryCount + 1})`)

      const channel = supabase.channel(channelName, {
        config: {
          // Add authentication if available
          presence: { key: 'user' },
          broadcast: { self: true },
        }
      })

      // Setup channel with provided configuration
      const configuredChannel = setupChannel(channel)

      // Subscribe with enhanced status handling
      configuredChannel.subscribe((status, err) => {
        console.log(`📡 Subscription status for ${channelName}:`, status, err)

        const channelState = this.channels.get(channelName)
        if (!channelState) return

        switch (status) {
          case 'SUBSCRIBED':
            console.log(`✅ Successfully subscribed to ${channelName}`)
            channelState.status = 'connected'
            channelState.retryCount = 0
            channelState.lastError = undefined
            break

          case 'CHANNEL_ERROR':
            console.error(`❌ Channel error for ${channelName}:`, err)
            channelState.status = 'error'
            channelState.lastError = new Error(`Channel error: ${err?.message || 'Unknown error'}`)

            // Retry with exponential backoff
            if (retryCount < this.maxRetries) {
              const delay = this.baseRetryDelay * Math.pow(2, retryCount)
              console.log(`⏳ Retrying ${channelName} in ${delay}ms...`)

              setTimeout(() => {
                this.unsubscribe(channelName)
                attemptSubscription(retryCount + 1)
              }, delay)
            } else {
              console.error(`💥 Max retries exceeded for ${channelName}`)
              if (onError) {
                onError(channelState.lastError)
              }
            }
            break

          case 'TIMED_OUT':
            console.warn(`⏰ Subscription timeout for ${channelName}`)
            channelState.status = 'error'
            channelState.lastError = new Error('Subscription timeout')

            // Retry on timeout
            if (retryCount < this.maxRetries) {
              setTimeout(() => {
                this.unsubscribe(channelName)
                attemptSubscription(retryCount + 1)
              }, this.baseRetryDelay)
            }
            break

          case 'CLOSED':
            console.warn(`🔒 Channel closed for ${channelName}`)
            channelState.status = 'disconnected'

            // Auto-reconnect on unexpected closure
            if (retryCount < this.maxRetries) {
              setTimeout(() => {
                this.unsubscribe(channelName)
                attemptSubscription(retryCount + 1)
              }, this.baseRetryDelay)
            }
            break

          default:
            console.log(`📊 Status update for ${channelName}:`, status)
            channelState.status = 'connecting'
        }
      })

      // Store channel state
      this.channels.set(channelName, {
        channel: configuredChannel,
        status: 'connecting',
        retryCount,
        onError,
      })
    }

    // Start initial subscription attempt
    attemptSubscription()
    return channelName
  }

  // Subscribe to space member presence
  subscribeToSpacePresence(
    spaceId: string,
    userId: string,
    onPresenceChange: (presences: any) => void
  ) {
    const channelName = `space:${spaceId}:presence`

    return this.createSubscription(
      channelName,
      (channel) => {
        return channel
          .on('presence', { event: 'sync' }, () => {
            const presences = channel.presenceState()
            console.log('👥 Presence sync:', presences)
            onPresenceChange(presences)
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            console.log('👋 User joined:', key, newPresences)
            const presences = channel.presenceState()
            onPresenceChange(presences)
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            console.log('👋 User left:', key, leftPresences)
            const presences = channel.presenceState()
            onPresenceChange(presences)
          })
      },
      undefined // No error callback for presence
    )
  }

  // Subscribe to broadcast events for a space
  subscribeToSpaceBroadcast(
    spaceId: string,
    onBroadcast: (event: string, payload: any) => void,
    onError?: (error: any) => void
  ) {
    const channelName = `space:${spaceId}:broadcast`

    return this.createSubscription(
      channelName,
      (channel) => {
        return channel.on('broadcast', { event: '*' }, (payload) => {
          console.log('📢 Broadcast received:', payload)
          onBroadcast(payload.event, payload.payload)
        })
      },
      onError
    )
  }

  // Send broadcast message to space
  async broadcastToSpace(
    spaceId: string,
    event: string,
    payload: any
  ): Promise<RealtimeChannelSendResponse> {
    const channelName = `space:${spaceId}:broadcast`

    let channelState = this.channels.get(channelName)
    if (!channelState || channelState.status !== 'connected') {
      // Create a temporary channel for broadcasting
      const tempChannel = supabase.channel(channelName)
      await tempChannel.subscribe()

      return tempChannel.send({
        type: 'broadcast',
        event,
        payload,
      })
    }

    return channelState.channel.send({
      type: 'broadcast',
      event,
      payload,
    })
  }

  // Get connection status for a channel
  getChannelStatus(channelName: string): string {
    const channelState = this.channels.get(channelName)
    return channelState?.status || 'disconnected'
  }

  // Get all channel statuses
  getAllChannelStatuses(): Record<string, string> {
    const statuses: Record<string, string> = {}
    this.channels.forEach((state, name) => {
      statuses[name] = state.status
    })
    return statuses
  }

  // Unsubscribe from a specific channel
  unsubscribe(channelName: string) {
    const channelState = this.channels.get(channelName)
    if (channelState) {
      supabase.removeChannel(channelState.channel)
      this.channels.delete(channelName)
      console.log(`🔌 Unsubscribed from ${channelName}`)
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    this.channels.forEach((channelState, channelName) => {
      supabase.removeChannel(channelState.channel)
      console.log(`🔌 Unsubscribed from ${channelName}`)
    })
    this.channels.clear()
  }

  // Force reconnect all channels
  reconnectAll() {
    console.log('🔄 Reconnecting all channels...')
    const channelNames = Array.from(this.channels.keys())

    // Store current configurations
    const configs = new Map<string, any>()
    this.channels.forEach((state, name) => {
      configs.set(name, {
        onError: state.onError,
        // We'll need to re-setup the channel configurations
      })
    })

    // Unsubscribe all
    this.unsubscribeAll()

    // Note: The actual re-subscription would need to be handled by the calling code
    // since we don't store the original subscription parameters
    console.log('📝 Channels cleared. Re-subscription needed from calling components.')
  }
}

// Create singleton instance
export const realtimeManager = new SupabaseRealtimeManager()