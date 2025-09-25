import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRealtimeMessages } from '@/hooks/use-realtime';
import { useAuth } from '@/hooks/use-auth';
import EmojiAvatar from '@/components/ui/emoji-avatar';
import type { Message, User } from '@shared/schema';

interface MessageListProps {
  spaceId: string;
}

export default function MessageList({ spaceId }: MessageListProps) {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: initialMessages = [] } = useQuery<(Message & { user: User })[]>({
    queryKey: ['/api/spaces', spaceId, 'messages'],
    enabled: !!spaceId,
  });

  const { messages: realtimeMessages, setMessages } = useRealtimeMessages(spaceId);

  // Combine initial messages with realtime updates
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages, setMessages]);

  const allMessages = realtimeMessages.length > 0 ? realtimeMessages : initialMessages;

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="space-y-4" data-testid="message-list">
      {allMessages.map((message: Message & { user: User }) => {
        const isCurrentUser = message.userId === currentUser?.id;
        const avatarData = message.user.avatarData as { emoji: string; backgroundColor: string } | null;

        if (message.messageType === 'system') {
          return (
            <div key={message.id} className="flex justify-center">
              <div className="bg-accent/20 text-accent px-3 py-1 rounded-full text-sm">
                <i className="fas fa-bell mr-2"></i>
                {message.content}
              </div>
            </div>
          );
        }

        return (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            data-testid={`message-${message.id}`}
          >
            {avatarData ? (
              <EmojiAvatar 
                emoji={avatarData.emoji}
                backgroundColor={avatarData.backgroundColor}
                size="medium"
              />
            ) : (
              <div className="w-10 h-10 bg-muted-foreground rounded-full flex items-center justify-center">
                <i className="fas fa-user text-background text-sm"></i>
              </div>
            )}
            
            <div className={`flex-1 flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
              <div className={`flex items-center space-x-2 mb-1 ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <span className="font-medium text-foreground text-sm">
                  {isCurrentUser ? 'You' : message.user.displayName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTime(message.createdAt!)}
                </span>
              </div>
              
              <div className={`max-w-[70%] rounded-lg p-3 shadow-sm ${
                isCurrentUser 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card text-foreground'
              }`}>
                {message.messageType === 'image' && message.attachments ? (
                  <div className="space-y-2">
                    {(message.attachments as any[]).map((attachment, index) => (
                      <img
                        key={index}
                        src={attachment.url}
                        alt={attachment.name || 'Image'}
                        className="rounded-lg max-w-xs"
                      />
                    ))}
                    {message.content && <p>{message.content}</p>}
                  </div>
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
