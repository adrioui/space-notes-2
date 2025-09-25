import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import type { MessageReaction, User } from '@shared/schema';

interface MessageReactionsProps {
  messageId: string;
}

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😢', '😮', '😡', '👏', '🎉'];

export default function MessageReactions({ messageId }: MessageReactionsProps) {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const { data: reactions = [] } = useQuery<(MessageReaction & { user: User })[]>({
    queryKey: ['/api/messages', messageId, 'reactions'],
  });

  const addReactionMutation = useMutation({
    mutationFn: (emoji: string) => 
      apiRequest('POST', `/api/messages/${messageId}/reactions`, { emoji }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', messageId, 'reactions'] });
      setShowEmojiPicker(false);
    },
  });

  const removeReactionMutation = useMutation({
    mutationFn: (emoji: string) => 
      apiRequest('DELETE', `/api/messages/${messageId}/reactions`, { emoji }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', messageId, 'reactions'] });
    },
  });

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((groups, reaction) => {
    if (!groups[reaction.emoji]) {
      groups[reaction.emoji] = [];
    }
    groups[reaction.emoji].push(reaction);
    return groups;
  }, {} as Record<string, (MessageReaction & { user: User })[]>);

  const handleReactionClick = (emoji: string) => {
    if (!currentUser) return;

    const userReaction = groupedReactions[emoji]?.find(r => r.userId === currentUser.id);
    
    if (userReaction) {
      removeReactionMutation.mutate(emoji);
    } else {
      addReactionMutation.mutate(emoji);
    }
  };

  const hasReactions = Object.keys(groupedReactions).length > 0;

  return (
    <div className="flex items-center space-x-1 mt-1">
      {/* Existing Reactions */}
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => {
        const hasUserReaction = reactionList.some(r => r.userId === currentUser?.id);
        const count = reactionList.length;
        
        return (
          <Button
            key={emoji}
            variant="ghost"
            size="sm"
            className={`h-6 px-2 text-xs ${
              hasUserReaction 
                ? 'bg-primary/20 text-primary border border-primary/30' 
                : 'bg-muted/50 hover:bg-muted'
            }`}
            onClick={() => handleReactionClick(emoji)}
            data-testid={`reaction-${emoji}`}
          >
            <span className="mr-1">{emoji}</span>
            <span>{count}</span>
          </Button>
        );
      })}

      {/* Add Reaction Button */}
      <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs bg-muted/50 hover:bg-muted"
            data-testid="button-add-reaction"
          >
            <i className="fas fa-plus text-muted-foreground"></i>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="grid grid-cols-8 gap-1">
            {COMMON_EMOJIS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-muted"
                onClick={() => handleReactionClick(emoji)}
                data-testid={`emoji-${emoji}`}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}