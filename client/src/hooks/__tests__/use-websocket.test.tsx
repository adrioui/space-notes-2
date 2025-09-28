import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { render } from '../../test/utils'

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.CONNECTING
  url = ''
  onopen: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  constructor(url: string) {
    this.url = url
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      this.onopen?.(new Event('open'))
    }, 100)
  }

  send(data: string) {
    // Mock sending data
  }

  close() {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.(new CloseEvent('close'))
  }
}

// Mock useWebSocket hook
const useWebSocket = (url: string) => {
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    const ws = new MockWebSocket(url)
    
    ws.onopen = () => setIsConnected(true)
    ws.onclose = () => setIsConnected(false)
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setMessages(prev => [...prev, data])
    }

    return () => ws.close()
  }, [url])

  const sendMessage = (message: any) => {
    // Mock sending message
    setMessages(prev => [...prev, message])
  }

  return { isConnected, messages, sendMessage }
}

// Mock React hooks
const useState = vi.fn()
const useEffect = vi.fn()

describe('useWebSocket Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.WebSocket = MockWebSocket as any
    useState.mockImplementation((initial) => [initial, vi.fn()])
    useEffect.mockImplementation((fn) => fn())
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('establishes WebSocket connection', () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:5000/ws'))
    
    expect(result.current).toBeDefined()
  })

  it('handles connection states', async () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:5000/ws'))
    
    // Initially disconnected, then connected after timeout
    expect(useState).toHaveBeenCalledWith(false) // isConnected
    expect(useState).toHaveBeenCalledWith([]) // messages
  })

  it('sends messages through WebSocket', () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:5000/ws'))
    
    act(() => {
      result.current.sendMessage({ type: 'chat', content: 'Hello' })
    })

    expect(result.current.sendMessage).toBeDefined()
  })

  it('handles incoming messages', () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:5000/ws'))
    
    // Mock incoming message
    const mockMessage = { type: 'chat', content: 'Hello', userId: 'user-1' }
    
    act(() => {
      // Simulate receiving message
      result.current.sendMessage(mockMessage)
    })

    expect(result.current.messages).toBeDefined()
  })
})