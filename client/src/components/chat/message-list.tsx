import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRealtimeMessages } from '@/hooks/use-realtime';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Reply } from 'lucide-react';
import EmojiAvatar from '@/components/ui/emoji-avatar';
import MessageReactions from './message-reactions';
import MessageReply from './message-reply';
import type { Message, User, SpaceMember } from '@shared/schema';

interface MessageListProps {
  spaceId: string;
}

export default function MessageList({ spaceId }: MessageListProps) {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState<(Message & { user: User }) | null>(null);
  
  const { data: initialMessages = [] } = useQuery<(Message & { user: User })[]>({
    queryKey: ['/api/spaces', spaceId, 'messages'],
    enabled: !!spaceId,
  });

  const { data: members = [] } = useQuery<(SpaceMember & { user: User })[]>({
    queryKey: ['/api/spaces', spaceId, 'members'],
    enabled: !!spaceId,
  });

  const { messages: realtimeMessages, setMessages } = useRealtimeMessages(spaceId);

  // Combine initial messages with realtime updates
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const allMessages = realtimeMessages.length > 0 ? realtimeMessages : initialMessages;

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getUserRole = (userId: string) => {
    const member = members.find(m => m.userId === userId);
    return member?.role || 'member';
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500 text-white';
      case 'moderator':
        return 'bg-yellow-500 text-white';
      default:
        return '';
    }
  };

  const findParentMessage = (parentMessageId: string) => {
    return allMessages.find(msg => msg.id === parentMessageId);
  };

  const handleReply = (message: Message & { user: User }) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
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
                <div className="flex items-center space-x-1">
                  <span className="font-medium text-foreground text-sm">
                    {isCurrentUser ? 'You' : message.user.displayName}
                  </span>
                  {(() => {
                    const userRole = getUserRole(message.userId);
                    const badgeColor = getRoleBadgeColor(userRole);
                    return userRole !== 'member' && badgeColor ? (
                      <Badge variant="secondary" className={`text-xs px-1.5 py-0.5 ${badgeColor}`}>
                        {userRole}
                      </Badge>
                    ) : null;
                  })()}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatTime(message.createdAt!)}
                </span>
              </div>
              
              <div className={`max-w-[70%] rounded-lg p-3 shadow-sm ${
                isCurrentUser 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-card text-foreground'
              }`}>
                {/* Reply Context */}
                {message.parentMessageId && (() => {
                  const parentMessage = findParentMessage(message.parentMessageId);
                  return parentMessage ? (
                    <div className={`mb-2 p-2 rounded border-l-2 ${
                      isCurrentUser 
                        ? 'border-primary-foreground/30 bg-primary-foreground/10' 
                        : 'border-muted-foreground/30 bg-muted/50'
                    }`}>
                      <div className={`text-xs font-medium ${
                        isCurrentUser ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      }`}>
                        Replying to {parentMessage.user.displayName}
                      </div>
                      <div className={`text-xs truncate ${
                        isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground/80'
                      }`}>
                        {parentMessage.content || (parentMessage.attachments ? 'Shared an image' : 'Message')}
                      </div>
                    </div>
                  ) : null;
                })()}

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
              
              {/* Message Reactions */}
              {message.messageType !== 'system' && (
                <div className="space-y-2">
                  <MessageReactions messageId={message.id} />
                  
                  {/* Reply Button */}
                  <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReply(message)}
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                      data-testid={`button-reply-${message.id}`}
                    >
                      <Reply className="w-3 h-3 mr-1" />
                      Reply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Reply Form */}
      {replyingTo && (
        <div className="mt-4">
          <MessageReply
            message={replyingTo}
            spaceId={spaceId}
            onCancel={handleCancelReply}
          />
        </div>
      )}
    </div>
  );
}
