'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { realtimeManager } from '@/lib/supabase-realtime'

interface SupabaseContextType {
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  reconnect: () => void
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [connectionStatus, setConnectionStatus] = useState<SupabaseContextType['connectionStatus']>('connecting')
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Test Supabase connection
    const testConnection = async () => {
      try {
        // Use head request to test connection without fetching data
        const { error } = await supabase.from('users').select('*', { head: true, count: 'exact' })
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is "table not found" which is okay
          console.error('Supabase connection error:', error)
          setConnectionStatus('error')
          setIsConnected(false)
        } else {
          console.log('Supabase connected successfully')
          setConnectionStatus('connected')
          setIsConnected(true)
        }
      } catch (error) {
        console.error('Failed to connect to Supabase:', error)
        setConnectionStatus('error')
        setIsConnected(false)
      }
    }

    testConnection()

    // Monitor realtime connection status
    const channel = supabase.channel('connection-test')
    channel.subscribe((status) => {
      console.log('Realtime connection status:', status)
      if (status === 'SUBSCRIBED') {
        setConnectionStatus('connected')
        setIsConnected(true)
      } else if (status === 'CLOSED') {
        setConnectionStatus('disconnected')
        setIsConnected(false)
      }
    })

    return () => {
      supabase.removeChannel(channel)
      realtimeManager.unsubscribeAll()
    }
  }, [])

  const reconnect = async () => {
    setConnectionStatus('connecting')
    setIsConnected(false)
    
    try {
      // Test connection again
      const { error } = await supabase.from('users').select('*', { head: true, count: 'exact' })
      
      if (error && error.code !== 'PGRST116') {
        throw error
      }
      
      setConnectionStatus('connected')
      setIsConnected(true)
    } catch (error) {
      console.error('Reconnection failed:', error)
      setConnectionStatus('error')
      setIsConnected(false)
    }
  }

  const value: SupabaseContextType = {
    isConnected,
    connectionStatus,
    reconnect,
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}