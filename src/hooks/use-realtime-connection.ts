'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { realtimeManager } from '@/lib/supabase-realtime'

export interface ConnectionStatus {
  isConnected: boolean
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  error?: string
  retryCount: number
  lastConnected?: Date
}

export interface ChannelStatus {
  [channelName: string]: {
    status: 'connecting' | 'connected' | 'disconnected' | 'error'
    error?: string
    retryCount: number
  }
}

/**
 * Hook for monitoring Supabase Realtime connection status
 */
export function useRealtimeConnection() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    status: 'disconnected',
    retryCount: 0,
  })
  
  const [channelStatuses, setChannelStatuses] = useState<ChannelStatus>({})
  const statusCheckInterval = useRef<NodeJS.Timeout>()

  // Check connection status periodically
  const checkConnectionStatus = useCallback(() => {
    const statuses = realtimeManager.getAllChannelStatuses()
    
    // Update channel statuses
    setChannelStatuses(prev => {
      const updated: ChannelStatus = {}
      
      // Update existing channels
      Object.keys(statuses).forEach(channelName => {
        const currentStatus = statuses[channelName]
        const prevChannel = prev[channelName]
        
        updated[channelName] = {
          status: currentStatus as any,
          error: prevChannel?.error,
          retryCount: prevChannel?.retryCount || 0,
        }
      })
      
      return updated
    })

    // Determine overall connection status
    const channelStatusValues = Object.values(statuses)
    const hasConnectedChannels = channelStatusValues.some(status => status === 'connected')
    const hasErrorChannels = channelStatusValues.some(status => status === 'error')
    const hasConnectingChannels = channelStatusValues.some(status => status === 'connecting')

    let overallStatus: ConnectionStatus['status']
    if (hasConnectedChannels && !hasErrorChannels) {
      overallStatus = 'connected'
    } else if (hasErrorChannels) {
      overallStatus = 'error'
    } else if (hasConnectingChannels) {
      overallStatus = 'connecting'
    } else {
      overallStatus = 'disconnected'
    }

    setConnectionStatus(prev => ({
      ...prev,
      isConnected: overallStatus === 'connected',
      status: overallStatus,
      lastConnected: overallStatus === 'connected' ? new Date() : prev.lastConnected,
    }))
  }, [])

  // Start monitoring
  useEffect(() => {
    // Initial check
    checkConnectionStatus()

    // Set up periodic checking
    statusCheckInterval.current = setInterval(checkConnectionStatus, 5000) // Check every 5 seconds

    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current)
      }
    }
  }, [checkConnectionStatus])

  // Force reconnect all channels
  const reconnectAll = useCallback(() => {
    console.log('🔄 Force reconnecting all Realtime channels...')
    
    setConnectionStatus(prev => ({
      ...prev,
      status: 'connecting',
      retryCount: prev.retryCount + 1,
    }))

    realtimeManager.reconnectAll()
    
    // Note: Individual components will need to re-establish their subscriptions
    // This is by design to ensure proper cleanup and re-initialization
  }, [])

  // Get status for a specific channel
  const getChannelStatus = useCallback((channelName: string) => {
    return channelStatuses[channelName] || {
      status: 'disconnected' as const,
      retryCount: 0,
    }
  }, [channelStatuses])

  // Check if a specific channel is connected
  const isChannelConnected = useCallback((channelName: string) => {
    return getChannelStatus(channelName).status === 'connected'
  }, [getChannelStatus])

  return {
    connectionStatus,
    channelStatuses,
    reconnectAll,
    getChannelStatus,
    isChannelConnected,
    checkConnectionStatus,
  }
}

/**
 * Hook for monitoring a specific channel's connection
 */
export function useChannelConnection(channelName: string) {
  const { getChannelStatus, isChannelConnected } = useRealtimeConnection()
  const [status, setStatus] = useState(getChannelStatus(channelName))

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getChannelStatus(channelName))
    }, 2000) // Check every 2 seconds

    return () => clearInterval(interval)
  }, [channelName, getChannelStatus])

  return {
    status,
    isConnected: isChannelConnected(channelName),
  }
}

/**
 * Hook for displaying connection status to users
 */
export function useConnectionIndicator() {
  const { connectionStatus, channelStatuses } = useRealtimeConnection()
  
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'connected': return 'green'
      case 'connecting': return 'yellow'
      case 'error': return 'red'
      default: return 'gray'
    }
  }, [])

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'connected': return '🟢'
      case 'connecting': return '🟡'
      case 'error': return '🔴'
      default: return '⚫'
    }
  }, [])

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case 'connected': return 'Connected'
      case 'connecting': return 'Connecting...'
      case 'error': return 'Connection Error'
      default: return 'Disconnected'
    }
  }, [])

  return {
    connectionStatus,
    channelStatuses,
    getStatusColor,
    getStatusIcon,
    getStatusText,
  }
}
