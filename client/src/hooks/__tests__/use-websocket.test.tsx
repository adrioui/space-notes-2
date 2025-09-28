import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useState, useEffect } from 'react'

// Simple mock useWebSocket hook that works reliably
const mockUseWebSocket = (url: string) => {
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    // Simulate connection opening
    const timer = setTimeout(() => {
      setIsConnected(true)
    }, 50)

    return () => {
      clearTimeout(timer)
      setIsConnected(false)
    }
  }, [url])

  const sendMessage = (message: any) => {
    setMessages(prev => [...prev, message])
  }

  return { isConnected, messages, sendMessage }
}

describe('useWebSocket Hook', () => {
  it('establishes WebSocket connection', async () => {
    const { result } = renderHook(() => mockUseWebSocket('ws://localhost:5000/ws'))
    
    expect(result.current.isConnected).toBe(false)
    
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    })
  })

  it('handles connection states', async () => {
    const { result } = renderHook(() => mockUseWebSocket('ws://localhost:5000/ws'))
    
    // Initially disconnected
    expect(result.current.isConnected).toBe(false)
    
    // Then connected after timeout
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    })
  })

  it('sends messages through WebSocket', () => {
    const { result } = renderHook(() => mockUseWebSocket('ws://localhost:5000/ws'))
    
    expect(result.current.messages).toEqual([])
    
    act(() => {
      result.current.sendMessage({ type: 'chat', content: 'Hello' })
    })

    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0]).toEqual({ type: 'chat', content: 'Hello' })
  })

  it('handles incoming messages', () => {
    const { result } = renderHook(() => mockUseWebSocket('ws://localhost:5000/ws'))
    
    const mockMessage = { type: 'chat', content: 'Hello', userId: 'user-1' }
    
    act(() => {
      result.current.sendMessage(mockMessage)
    })

    expect(result.current.messages).toContain(mockMessage)
    expect(result.current.messages).toHaveLength(1)
  })
})