import { useEffect, useState, useRef } from 'react';
import type { Message, User } from '@shared/schema';

interface RealtimeMessage {
  type: string;
  data: any;
}

export function useRealtimeMessages(spaceId: string | null) {
  const [messages, setMessages] = useState<(Message & { user: User })[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!spaceId) return;

    // Connect to WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}?spaceId=${spaceId}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const message: RealtimeMessage = JSON.parse(event.data);
      
      if (message.type === 'new_message') {
        setMessages(prev => [...prev, message.data]);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [spaceId]);

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return { messages, setMessages, sendMessage };
}
