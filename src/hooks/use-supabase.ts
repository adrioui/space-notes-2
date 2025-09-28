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

  // Use refs to store the latest callbacks without causing re-subscriptions
  const onMessageRef = useRef(onMessage)
  const onErrorRef = useRef(onError)

  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  useEffect(() => {
    if (!spaceId) return

    // Use stable callback wrappers that reference the current callbacks
    const stableOnMessage = (payload: any) => onMessageRef.current(payload)
    const stableOnError = onErrorRef.current ? (error: any) => onErrorRef.current?.(error) : undefined

    const subscriptionId = realtime.subscribeToSpaceMessages(spaceId, stableOnMessage, stableOnError)

    return () => {
      realtime.unsubscribe(subscriptionId)
    }
  }, [spaceId, realtime]) // Only depend on spaceId and realtime, not the callbacks
}

// Hook for space presence subscription
export function useSpacePresence(
  spaceId: string | null,
  userId: string | null,
  onPresenceChange: (presences: any) => void
) {
  const realtime = useSupabaseRealtime()

  // Use ref to store the latest callback without causing re-subscriptions
  const onPresenceChangeRef = useRef(onPresenceChange)

  // Update ref when callback changes
  useEffect(() => {
    onPresenceChangeRef.current = onPresenceChange
  }, [onPresenceChange])

  useEffect(() => {
    if (!spaceId || !userId) return

    // Use stable callback wrapper
    const stableOnPresenceChange = (presences: any) => onPresenceChangeRef.current(presences)

    const subscriptionId = realtime.subscribeToSpacePresence(spaceId, userId, stableOnPresenceChange)

    return () => {
      realtime.unsubscribe(subscriptionId)
    }
  }, [spaceId, userId, realtime]) // Only depend on spaceId, userId, and realtime
}

// Hook for space broadcast subscription
export function useSpaceBroadcast(
  spaceId: string | null,
  onBroadcast: (event: string, payload: any) => void,
  onError?: (error: any) => void
) {
  const realtime = useSupabaseRealtime()

  // Use refs to store the latest callbacks without causing re-subscriptions
  const onBroadcastRef = useRef(onBroadcast)
  const onErrorRef = useRef(onError)

  // Update refs when callbacks change
  useEffect(() => {
    onBroadcastRef.current = onBroadcast
  }, [onBroadcast])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  useEffect(() => {
    if (!spaceId) return

    // Use stable callback wrappers
    const stableOnBroadcast = (event: string, payload: any) => onBroadcastRef.current(event, payload)
    const stableOnError = onErrorRef.current ? (error: any) => onErrorRef.current?.(error) : undefined

    const subscriptionId = realtime.subscribeToSpaceBroadcast(spaceId, stableOnBroadcast, stableOnError)

    return () => {
      realtime.unsubscribe(subscriptionId)
    }
  }, [spaceId, realtime]) // Only depend on spaceId and realtime
}