interface EmojiAvatarProps {
  emoji: string;
  backgroundColor: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function EmojiAvatar({ 
  emoji, 
  backgroundColor, 
  size = 'medium',
  className = '' 
}: EmojiAvatarProps) {
  const sizeClasses = {
    small: 'w-8 h-8 text-sm',
    medium: 'w-10 h-10 text-lg',
    large: 'w-16 h-16 text-2xl',
  };

  return (
    <div 
      className={`rounded-full flex items-center justify-center ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor }}
      data-testid="emoji-avatar"
    >
      {emoji}
    </div>
  );
}
