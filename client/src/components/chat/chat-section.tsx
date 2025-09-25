import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import MessageList from './message-list';
import MessageInput from './message-input';
import type { Space } from '@shared/schema';

interface ChatSectionProps {
  spaceId: string | null;
  space?: Space;
}

export default function ChatSection({ spaceId, space }: ChatSectionProps) {
  const { data: members = [] } = useQuery({
    queryKey: ['/api/spaces', spaceId, 'members'],
    enabled: !!spaceId,
  });

  if (!spaceId || !space) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <i className="fas fa-comments text-4xl text-muted-foreground mb-4"></i>
          <h3 className="text-lg font-medium text-foreground mb-2">No space selected</h3>
          <p className="text-muted-foreground">Select a space to start chatting</p>
        </div>
      </div>
    );
  }

  const wallpaperClass = space.wallpaper === 'growth' ? 'wallpaper-growth' : '';

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="bg-card border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
            <span className="text-lg">{space.emoji}</span>
          </div>
          <div>
            <h2 className="font-semibold text-foreground" data-testid="space-name">
              {space.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {members.length} member{members.length !== 1 ? 's' : ''} online
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" data-testid="button-show-members">
            <i className="fas fa-users text-muted-foreground"></i>
          </Button>
          <Button variant="ghost" size="sm" data-testid="button-space-settings">
            <i className="fas fa-cog text-muted-foreground"></i>
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className={`flex-1 overflow-y-auto p-4 ${wallpaperClass}`}>
        <MessageList spaceId={spaceId} />
      </div>

      {/* Message Input */}
      <div className="bg-card border-t border-border">
        <MessageInput spaceId={spaceId} />
      </div>
    </div>
  );
}
