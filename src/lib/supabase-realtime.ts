'use client'

import { supabase } from './supabase'
import type { RealtimeChannel, RealtimeChannelSendResponse } from '@supabase/supabase-js'

export class SupabaseRealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map()

  // Subscribe to space messages
  subscribeToSpaceMessages(
    spaceId: string,
    onMessage: (payload: any) => void,
    onError?: (error: any) => void
  ) {
    const channelName = `space:${spaceId}:messages`
    
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName)
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `space_id=eq.${spaceId}`,
        },
        (payload) => {
          console.log('New message received:', payload)
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
          console.log('Message updated:', payload)
          onMessage(payload)
        }
      )
      .subscribe((status) => {
        console.log(`Subscription status for ${channelName}:`, status)
        if (status !== 'SUBSCRIBED' && onError) {
          onError(new Error(`Failed to subscribe to ${channelName}`))
        }
      })

    this.channels.set(channelName, channel)
    return channelName
  }

  // Subscribe to space member presence
  subscribeToSpacePresence(
    spaceId: string,
    userId: string,
    onPresenceChange: (presences: any) => void
  ) {
    const channelName = `space:${spaceId}:presence`
    
    if (this.channels.has(channelName)) {
      this.unsubscribe(channelName)
    }

    const channel = supabase
      .channel(channelName, {
        config: {
          presence: {
            key: userId, // Use userId as presence key for proper tracking
          },
        },
      })
      .on('presence', { event: 'sync' }, () => {
        const presences = channel.presenceState()
        console.log('Presence sync:', presences)
        onPresenceChange(presences)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
        const presences = channel.presenceState()
        onPresenceChange(presences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
        const presences = channel.presenceState()
        onPresenceChange(presences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track user presence when subscribed
          await channel.track({ 
            userId, 
            online_at: new Date().toISOString(),
            user_id: userId // Ensure user ID is available in presence data
          })
        }
      })

    this.channels.set(channelName, channel)
    return channelName
  }

  // Send broadcast message to space
  async broadcastToSpace(
    spaceId: string,
    event: string,
    payload: any
  ): Promise<RealtimeChannelSendResponse> {
    const channelName = `space:${spaceId}:broadcast`
    
    let channel = this.channels.get(channelName)
    if (!channel) {
      channel = supabase.channel(channelName)
      await channel.subscribe()
      this.channels.set(channelName, channel)
    }

    return channel.send({
      type: 'broadcast',
      event,
      payload,
    })
  }

  // Unsubscribe from a specific channel
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName)
    if (channel) {
      supabase.removeChannel(channel)
      this.channels.delete(channelName)
      console.log(`Unsubscribed from ${channelName}`)
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    this.channels.forEach((channel, channelName) => {
      supabase.removeChannel(channel)
      console.log(`Unsubscribed from ${channelName}`)
    })
    this.channels.clear()
  }
}

// Create singleton instance
export const realtimeManager = new SupabaseRealtimeManager()