import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase server environment variables')
}

// Create server-side Supabase client with service role key
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

/**
 * Server-side real-time broadcasting utility
 * This can be called from API routes to broadcast messages
 */
export class ServerRealtimeManager {
  /**
   * Broadcast a message to all clients subscribed to a space channel
   * @param spaceId - The space ID to broadcast to
   * @param event - The event type (e.g., 'new_message')
   * @param payload - The message data to broadcast
   */
  static async broadcastToSpace(
    spaceId: string,
    event: string,
    payload: any
  ): Promise<{ status: string; error?: string }> {
    try {
      const channelName = `space:${spaceId}:broadcast`
      
      // Create a temporary channel for broadcasting
      const channel = supabaseServer.channel(channelName)
      
      // Subscribe to the channel first
      await new Promise((resolve, reject) => {
        channel
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              resolve(status)
            } else if (status === 'CHANNEL_ERROR') {
              reject(new Error('Failed to subscribe to channel'))
            }
          })
      })

      // Send the broadcast message
      const result = await channel.send({
        type: 'broadcast',
        event,
        payload,
      })

      // Clean up the channel
      await supabaseServer.removeChannel(channel)

      if (result === 'ok') {
        console.log(`✅ Message broadcast to space ${spaceId}:`, event, payload.id)
        return { status: 'success' }
      } else {
        console.error(`❌ Failed to broadcast message to space ${spaceId}:`, result)
        return { status: 'error', error: 'Broadcast failed' }
      }
    } catch (error) {
      console.error(`❌ Server broadcast error for space ${spaceId}:`, error)
      return { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Trigger a database change notification
   * This is useful for triggering postgres_changes subscriptions
   */
  static async notifyDatabaseChange(
    table: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE',
    record: any
  ): Promise<void> {
    try {
      // This will trigger postgres_changes subscriptions automatically
      // when the database record is inserted/updated/deleted
      console.log(`📡 Database change notification: ${event} on ${table}`, record.id)
    } catch (error) {
      console.error('Database change notification error:', error)
    }
  }
}
