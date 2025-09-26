'use client'

import { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import EmojiAvatar from '@/components/ui/emoji-avatar'
import type { SpaceMember, User } from '@shared/schema'

interface MembersDialogClientProps {
  spaceId: string
  children: ReactNode
}

export default function MembersDialogClient({ spaceId, children }: MembersDialogClientProps) {
  const { data: members = [] } = useQuery<(SpaceMember & { user: User })[]>({
    queryKey: ['/api/spaces', spaceId, 'members'],
    enabled: !!spaceId,
  })

  const formatJoinDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'moderator':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Space Members ({members.length})
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {members.map((member) => {
            const avatarData = member.user.avatarData as { emoji: string; backgroundColor: string } | null

            return (
              <div
                key={member.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50"
              >
                {avatarData ? (
                  <EmojiAvatar
                    emoji={avatarData.emoji}
                    backgroundColor={avatarData.backgroundColor}
                    size="medium"
                  />
                ) : (
                  <div className="w-10 h-10 bg-muted-foreground rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-background"></i>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-foreground truncate">
                      {member.user.displayName}
                    </p>
                    <Badge variant={getRoleBadgeVariant(member.role)}>
                      {member.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    @{member.user.username}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined {formatJoinDate(member.joinedAt)}
                  </p>
                </div>
              </div>
            )
          })}
          
          {members.length === 0 && (
            <div className="text-center py-8">
              <i className="fas fa-users text-4xl text-muted-foreground mb-4"></i>
              <p className="text-muted-foreground">No members found</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}