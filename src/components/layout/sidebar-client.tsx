'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import EmojiAvatar from '@/components/ui/emoji-avatar'
import ProfileSettings from '@/components/modals/profile-settings-client'
import SpaceCreator from '@/components/modals/space-creator-client'
import JoinSpaceClient from '@/components/modals/join-space-client'
import type { Space } from '@shared/schema'

interface SidebarClientProps {
  spaces: Space[]
  selectedSpaceId: string | null
  onSelectSpace: (spaceId: string) => void
}

export default function SidebarClient({ spaces, selectedSpaceId, onSelectSpace }: SidebarClientProps) {
  const { data: session } = useSession()
  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [showSpaceCreator, setShowSpaceCreator] = useState(false)
  const [showJoinSpace, setShowJoinSpace] = useState(false)

  if (!session?.user) return null

  const user = session.user as any // NextAuth user extended with our fields
  const avatarData = user.avatarData as { emoji: string; backgroundColor: string } | null

  return (
    <>
      <div className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-40">
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 gradient-bg rounded-lg flex items-center justify-center">
              <i className="fas fa-users text-primary-foreground"></i>
            </div>
            <h1 className="text-xl font-bold text-foreground">Spaces</h1>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg mb-4">
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
            <div className="flex-1">
              <p className="font-medium text-foreground" data-testid="user-display-name">
                {user.displayName || user.name}
              </p>
              <p className="text-sm text-muted-foreground" data-testid="user-username">
                @{user.username || 'user'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProfileSettings(true)}
              data-testid="button-edit-profile"
            >
              <i className="fas fa-cog"></i>
            </Button>
          </div>

          {/* Spaces List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Your Spaces
              </h3>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowJoinSpace(true)}
                  data-testid="button-join-space"
                  title="Join space with invite code"
                >
                  <i className="fas fa-sign-in-alt"></i>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSpaceCreator(true)}
                  data-testid="button-create-space"
                  title="Create new space"
                >
                  <i className="fas fa-plus"></i>
                </Button>
              </div>
            </div>

            {spaces.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-rocket text-2xl text-muted-foreground mb-4"></i>
                <p className="text-sm text-muted-foreground mb-4">No spaces yet</p>
                <div className="space-y-2">
                  <Button
                    size="sm"
                    onClick={() => setShowSpaceCreator(true)}
                    data-testid="button-create-first-space"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Create your first space
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowJoinSpace(true)}
                    data-testid="button-join-first-space"
                  >
                    <i className="fas fa-sign-in-alt mr-2"></i>
                    Join with invite code
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {spaces.map((space) => (
                  <button
                    key={space.id}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedSpaceId === space.id
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => onSelectSpace(space.id)}
                    data-testid={`space-${space.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
                        <span className="text-sm">{space.emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {space.name}
                        </p>
                        {space.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {space.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showProfileSettings && (
        <ProfileSettings
          isOpen={showProfileSettings}
          onClose={() => setShowProfileSettings(false)}
        />
      )}
      
      {showSpaceCreator && (
        <SpaceCreator
          isOpen={showSpaceCreator}
          onClose={() => setShowSpaceCreator(false)}
        />
      )}
      
      {showJoinSpace && (
        <JoinSpaceClient
          isOpen={showJoinSpace}
          onClose={() => setShowJoinSpace(false)}
        />
      )}
    </>
  )
}