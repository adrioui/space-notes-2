import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Reply } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import type { Message, User } from '@shared/schema';

interface MessageReplyProps {
  message: Message & { user: User };
  spaceId: string;
  onCancel: () => void;
}

export default function MessageReply({ message, spaceId, onCancel }: MessageReplyProps) {
  const [content, setContent] = useState('');

  const sendReplyMutation = useMutation({
    mutationFn: (content: string) =>
      apiRequest('POST', `/api/spaces/${spaceId}/messages`, {
        content,
        parentMessageId: message.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spaces', spaceId, 'messages'] });
      setContent('');
      onCancel();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      sendReplyMutation.mutate(content.trim());
    }
  };

  return (
    <div className="border rounded-lg p-3 bg-muted/50 space-y-3" data-testid="message-reply">
      {/* Reply Context */}
      <div className="flex items-start space-x-2 text-sm">
        <Reply className="w-4 h-4 text-muted-foreground mt-0.5" />
        <div className="flex-1">
          <div className="text-muted-foreground">
            Replying to <span className="font-medium">{message.user.displayName}</span>
          </div>
          <div className="text-muted-foreground/80 truncate">
            {message.content || (message.attachments ? 'Shared an image' : 'Message')}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-6 w-6 p-0"
          data-testid="button-cancel-reply"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Reply Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your reply..."
          className="min-h-[80px] resize-none"
          data-testid="textarea-reply-content"
          disabled={sendReplyMutation.isPending}
        />
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={sendReplyMutation.isPending}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || sendReplyMutation.isPending}
            data-testid="button-send-reply"
          >
            {sendReplyMutation.isPending ? 'Sending...' : 'Reply'}
          </Button>
        </div>
      </form>
    </div>
  );
}