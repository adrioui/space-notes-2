import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EmojiAvatar from '@/components/ui/emoji-avatar';
import type { SpaceMember, User } from '@shared/schema';

interface MembersDialogProps {
  spaceId: string;
  children: React.ReactNode;
}

export default function MembersDialog({ spaceId, children }: MembersDialogProps) {
  const [open, setOpen] = useState(false);

  const { data: members = [] } = useQuery<(SpaceMember & { user: User })[]>({
    queryKey: ['/api/spaces', spaceId, 'members'],
    enabled: !!spaceId && open, // Only fetch when dialog is open
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
      case 'organizer':
        return 'bg-red-500 text-white';
      case 'moderator':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'organizer':
        return 'Admin';
      case 'moderator':
        return 'Moderator';
      case 'member':
        return 'Member';
      default:
        return role;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Space Members</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No members found</p>
            </div>
          ) : (
            members.map((member) => {
              const avatarData = member.user.avatarData as any;
              
              return (
                <div
                  key={member.id}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50"
                  data-testid={`member-${member.id}`}
                >
                  {/* Avatar */}
                  {avatarData?.emoji ? (
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
                  
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-foreground truncate">
                        {member.user.displayName}
                      </p>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs px-2 py-0.5 ${getRoleBadgeColor(member.role)}`}
                      >
                        {getRoleDisplayName(member.role)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      @{member.user.username}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}