'use client'

import { useEffect, useRef } from 'react'
import { realtimeManager } from '@/lib/supabase-realtime'
import { storageManager } from '@/lib/supabase-storage'

export function useSupabaseRealtime() {
  const managerRef = useRef(realtimeManager)
  return managerRef.current
}

export function useSupabaseStorage() {
  return storageManager
}

// Hook for space messages subscription
export function useSpaceMessages(
  spaceId: string | null,
  onMessage: (payload: any) => void,
  onError?: (error: any) => void
) {
  const realtime = useSupabaseRealtime()

  useEffect(() => {
    if (!spaceId) return

    const subscriptionId = realtime.subscribeToSpaceMessages(spaceId, onMessage, onError)

    return () => {
      realtime.unsubscribe(subscriptionId)
    }
  }, [spaceId, onMessage, onError, realtime])
}

// Hook for space presence subscription
export function useSpacePresence(
  spaceId: string | null,
  userId: string | null,
  onPresenceChange: (presences: any) => void
) {
  const realtime = useSupabaseRealtime()

  useEffect(() => {
    if (!spaceId || !userId) return

    const subscriptionId = realtime.subscribeToSpacePresence(spaceId, userId, onPresenceChange)

    return () => {
      realtime.unsubscribe(subscriptionId)
    }
  }, [spaceId, userId, onPresenceChange, realtime])
}