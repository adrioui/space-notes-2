'use client'

import { useState } from 'react'
import { useConnectionIndicator } from '@/hooks/use-realtime-connection'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface ConnectionStatusProps {
  showDetails?: boolean
  className?: string
}

export function ConnectionStatus({ showDetails = false, className = '' }: ConnectionStatusProps) {
  const { 
    connectionStatus, 
    channelStatuses, 
    getStatusColor, 
    getStatusIcon, 
    getStatusText 
  } = useConnectionIndicator()
  
  const [isOpen, setIsOpen] = useState(false)

  if (!showDetails) {
    // Simple status indicator
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <span className="text-sm">
          {getStatusIcon(connectionStatus.status)}
        </span>
        <span className="text-xs text-muted-foreground">
          {getStatusText(connectionStatus.status)}
        </span>
      </div>
    )
  }

  // Detailed status panel
  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Realtime Connection</span>
          <Badge 
            variant={connectionStatus.status === 'connected' ? 'default' : 'destructive'}
            className="text-xs"
          >
            {getStatusIcon(connectionStatus.status)} {getStatusText(connectionStatus.status)}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Overall Status */}
        <div className="flex items-center justify-between text-sm">
          <span>Status:</span>
          <span style={{ color: getStatusColor(connectionStatus.status) }}>
            {getStatusText(connectionStatus.status)}
          </span>
        </div>

        {connectionStatus.retryCount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span>Retry Count:</span>
            <span className="text-muted-foreground">{connectionStatus.retryCount}</span>
          </div>
        )}

        {connectionStatus.lastConnected && (
          <div className="flex items-center justify-between text-sm">
            <span>Last Connected:</span>
            <span className="text-muted-foreground text-xs">
              {connectionStatus.lastConnected.toLocaleTimeString()}
            </span>
          </div>
        )}

        {connectionStatus.error && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            {connectionStatus.error}
          </div>
        )}

        {/* Channel Details */}
        {Object.keys(channelStatuses).length > 0 && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-xs">
                Channel Details ({Object.keys(channelStatuses).length})
                <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}></i>
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-2 mt-2">
              {Object.entries(channelStatuses).map(([channelName, status]) => (
                <div 
                  key={channelName} 
                  className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded"
                >
                  <span className="font-mono truncate flex-1 mr-2">
                    {channelName.split(':').pop()}
                  </span>
                  <div className="flex items-center space-x-1">
                    <span>{getStatusIcon(status.status)}</span>
                    <span style={{ color: getStatusColor(status.status) }}>
                      {status.status}
                    </span>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Simple connection indicator for the header/navbar
 */
export function ConnectionIndicator({ className = '' }: { className?: string }) {
  const { connectionStatus, getStatusIcon, getStatusText } = useConnectionIndicator()
  
  return (
    <div 
      className={`flex items-center space-x-1 text-xs ${className}`}
      title={`Realtime: ${getStatusText(connectionStatus.status)}`}
    >
      <span>{getStatusIcon(connectionStatus.status)}</span>
      {connectionStatus.status === 'connecting' && (
        <span className="animate-pulse">Connecting...</span>
      )}
      {connectionStatus.status === 'error' && (
        <span className="text-red-600">Error</span>
      )}
    </div>
  )
}

/**
 * Connection status for development/debugging
 */
export function ConnectionDebugPanel({ className = '' }: { className?: string }) {
  const { 
    connectionStatus, 
    channelStatuses, 
    getStatusColor, 
    getStatusIcon, 
    getStatusText 
  } = useConnectionIndicator()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <Card className="w-80 bg-black/90 text-white border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-green-400">
            🔧 Realtime Debug Panel
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span>Overall Status:</span>
            <span style={{ color: getStatusColor(connectionStatus.status) }}>
              {getStatusIcon(connectionStatus.status)} {getStatusText(connectionStatus.status)}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Connected:</span>
            <span className={connectionStatus.isConnected ? 'text-green-400' : 'text-red-400'}>
              {connectionStatus.isConnected ? 'Yes' : 'No'}
            </span>
          </div>

          {connectionStatus.retryCount > 0 && (
            <div className="flex justify-between">
              <span>Retries:</span>
              <span className="text-yellow-400">{connectionStatus.retryCount}</span>
            </div>
          )}

          {Object.keys(channelStatuses).length > 0 && (
            <div className="border-t border-gray-600 pt-2 mt-2">
              <div className="text-gray-300 mb-1">Channels:</div>
              {Object.entries(channelStatuses).map(([name, status]) => (
                <div key={name} className="flex justify-between items-center">
                  <span className="truncate max-w-[150px]" title={name}>
                    {name.split(':').slice(-1)[0]}
                  </span>
                  <span style={{ color: getStatusColor(status.status) }}>
                    {getStatusIcon(status.status)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {connectionStatus.error && (
            <div className="border-t border-gray-600 pt-2 mt-2">
              <div className="text-red-400 text-xs">
                Error: {connectionStatus.error}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
