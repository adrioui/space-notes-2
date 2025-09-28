import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Message, User } from '@shared/schema';

export function useRealtimeMessages(spaceId: string | null) {
  const [messages, setMessages] = useState<(Message & { user: User })[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!spaceId) {
      setIsConnected(false);
      return;
    }

    // Create Supabase channel for the space
    const realtimeChannel = supabase
      .channel(`space:${spaceId}`)
      .on('broadcast', { event: 'new_message' }, (payload) => {
        console.log('New message via Supabase broadcast:', payload);
        // Add the new message to local state for immediate UI update
        if (payload.payload) {
          setMessages(prev => [...prev, payload.payload]);
        }
      })
      .on('broadcast', { event: 'message_reaction' }, (payload) => {
        console.log('Message reaction via Supabase:', payload);
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') {
          console.log('Connected to Supabase Realtime for space:', spaceId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Supabase Realtime channel error for space:', spaceId);
          setIsConnected(false);
        }
      });

    setChannel(realtimeChannel);

    return () => {
      realtimeChannel.unsubscribe();
      setChannel(null);
      setIsConnected(false);
    };
  }, [spaceId]);

  // Broadcast message through Supabase channel for immediate updates
  const broadcastMessage = useCallback((message: any) => {
    if (!channel || !spaceId) return;

    // Broadcast through Supabase channel for real-time updates
    channel.send({
      type: 'broadcast',
      event: 'new_message',
      payload: message,
    });
  }, [channel, spaceId]);

  const sendMessage = useCallback((message: any) => {
    // Broadcast the update via Supabase for immediate UI updates
    broadcastMessage(message);
  }, [broadcastMessage]);

  return { 
    messages, 
    setMessages, 
    sendMessage, 
    isConnected,
    broadcastMessage 
  };
}

// Hook for space presence (online users)
export function useSpacePresence(spaceId: string | null, user: User | null) {
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!spaceId || !user) {
      setOnlineUsers([]);
      return;
    }

    const presenceChannel = supabase
      .channel(`presence:${spaceId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users = Object.values(state).flat();
        // Extract user data from presence state
        const userList = users.map((presence: any) => presence.user_data).filter(Boolean);
        setOnlineUsers(userList);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined space:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left space:', key, leftPresences);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user presence
          presenceChannel.track({
            user_data: {
              user_id: user.id,
              display_name: user.displayName,
              avatar_data: user.avatarData,
              online_at: new Date().toISOString(),
            }
          });
        }
      });

    setChannel(presenceChannel);

    return () => {
      presenceChannel.unsubscribe();
      setChannel(null);
      setOnlineUsers([]);
    };
  }, [spaceId, user]);

  return { onlineUsers, onlineCount: onlineUsers.length };
}
