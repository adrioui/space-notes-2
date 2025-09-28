import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import EmojiAvatar from '@/components/ui/emoji-avatar';
import ProfileSettings from '@/components/modals/profile-settings';
import SpaceCreator from '@/components/modals/space-creator';
import type { Space } from '@shared/schema';

interface SidebarProps {
  spaces: Space[];
  selectedSpaceId: string | null;
  onSelectSpace: (spaceId: string | null) => void;
}

export default function Sidebar({ spaces, selectedSpaceId, onSelectSpace }: SidebarProps) {
  const { user } = useAuth();
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showSpaceCreator, setShowSpaceCreator] = useState(false);

  if (!user) return null;

  const avatarData = user.avatarData as { emoji: string; backgroundColor: string } | null;

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
                {user.displayName}
              </p>
              <p className="text-sm text-muted-foreground" data-testid="user-username">
                @{user.username}
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSpaceCreator(true)}
                data-testid="button-create-space"
              >
                <i className="fas fa-plus text-accent"></i>
              </Button>
            </div>

            {spaces.map((space) => (
              <div
                key={space.id}
                className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-muted cursor-pointer border-l-2 ${
                  selectedSpaceId === space.id ? 'border-primary bg-muted' : 'border-transparent'
                }`}
                onClick={() => onSelectSpace(selectedSpaceId === space.id ? null : space.id)}
                data-testid={`space-${space.id}`}
              >
                <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
                  <span className="text-sm">{space.emoji}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{space.name}</p>
                  <p className="text-xs text-muted-foreground">Active space</p>
                </div>
              </div>
            ))}

            {spaces.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">No spaces yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSpaceCreator(true)}
                  data-testid="button-create-first-space"
                >
                  Create your first space
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ProfileSettings 
        isOpen={showProfileSettings}
        onClose={() => setShowProfileSettings(false)}
      />
      
      <SpaceCreator
        isOpen={showSpaceCreator}
        onClose={() => setShowSpaceCreator(false)}
      />
    </>
  );
}
