import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiCall, uploadFile } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import EmojiAvatar from '@/components/ui/emoji-avatar';

const profileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface ProfileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMOJI_OPTIONS = ['🌟', '👨‍💻', '👩‍💻', '🎨', '🚀', '💡', '🎯', '🔥', '✨', '💪', '🌈', '⚡'];
const BG_COLORS = [
  'hsl(262.1 83.3% 77.8%)', // purple
  'hsl(197 92% 81%)', // blue
  'hsl(120 60% 75%)', // green
  'hsl(45 90% 75%)', // yellow
  'hsl(0 75% 75%)', // red
  'hsl(300 50% 75%)', // pink
];

export default function ProfileSettings({ isOpen, onClose }: ProfileSettingsProps) {
  const { user, setUser } = useAuth();
  const [avatarType, setAvatarType] = useState<'emoji' | 'upload' | 'default'>('emoji');
  const [selectedEmoji, setSelectedEmoji] = useState('🌟');
  const [selectedBgColor, setSelectedBgColor] = useState(BG_COLORS[0]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      username: '',
    },
  });

  // Initialize form with user data
  useEffect(() => {
    if (user && isOpen) {
      form.reset({
        displayName: user.displayName,
        username: user.username,
      });
      
      setAvatarType(user.avatarType as 'emoji' | 'upload' | 'default');
      
      if (user.avatarType === 'emoji' && user.avatarData) {
        const avatarData = user.avatarData as { emoji: string; backgroundColor: string };
        setSelectedEmoji(avatarData.emoji);
        setSelectedBgColor(avatarData.backgroundColor);
      } else if (user.avatarType === 'upload' && user.avatarData) {
        const avatarData = user.avatarData as { imageUrl: string };
        setUploadedImage(avatarData.imageUrl);
      }
    }
  }, [user, isOpen, form]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => apiCall(`/users/${user?.id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Only image files are supported',
      });
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await uploadFile(file, `avatars/${user?.id}/${file.name}`);
      setUploadedImage(imageUrl);
      setAvatarType('upload');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to upload image',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = (data: ProfileForm) => {
    let avatarData;
    
    switch (avatarType) {
      case 'emoji':
        avatarData = { emoji: selectedEmoji, backgroundColor: selectedBgColor };
        break;
      case 'upload':
        avatarData = { imageUrl: uploadedImage };
        break;
      default:
        avatarData = null;
    }

    const profileData = {
      ...data,
      avatarType,
      avatarData,
    };

    updateProfileMutation.mutate(profileData);
  };

  const renderAvatar = () => {
    switch (avatarType) {
      case 'emoji':
        return (
          <EmojiAvatar 
            emoji={selectedEmoji}
            backgroundColor={selectedBgColor}
            size="large"
          />
        );
      case 'upload':
        return uploadedImage ? (
          <img 
            src={uploadedImage} 
            alt="Profile" 
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <i className="fas fa-camera text-muted-foreground"></i>
          </div>
        );
      default:
        return (
          <div className="w-16 h-16 bg-muted-foreground rounded-full flex items-center justify-center">
            <i className="fas fa-user text-background text-2xl"></i>
          </div>
        );
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Avatar Selection */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                {renderAvatar()}
              </div>
              
              {/* Avatar Type Selection */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={avatarType === 'emoji' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAvatarType('emoji')}
                  data-testid="avatar-type-emoji"
                >
                  <i className="fas fa-smile mr-1"></i>Emoji
                </Button>
                <Button
                  type="button"
                  variant={avatarType === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setAvatarType('upload');
                    fileInputRef.current?.click();
                  }}
                  disabled={isUploading}
                  data-testid="avatar-type-upload"
                >
                  <i className={`fas ${isUploading ? 'fa-spinner fa-spin' : 'fa-camera'} mr-1`}></i>
                  Photo
                </Button>
                <Button
                  type="button"
                  variant={avatarType === 'default' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAvatarType('default')}
                  data-testid="avatar-type-default"
                >
                  <i className="fas fa-user mr-1"></i>Default
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {/* Emoji Selection */}
              {avatarType === 'emoji' && (
                <>
                  <div>
                    <p className="text-sm font-medium mb-2">Choose Emoji</p>
                    <div className="grid grid-cols-6 gap-2 justify-center">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <Button
                          key={emoji}
                          type="button"
                          variant={selectedEmoji === emoji ? 'default' : 'outline'}
                          size="sm"
                          className="w-10 h-10 p-0"
                          onClick={() => setSelectedEmoji(emoji)}
                          data-testid={`emoji-${emoji}`}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Background Color Selection */}
                  <div>
                    <p className="text-sm font-medium mb-2">Background Color</p>
                    <div className="flex justify-center space-x-2">
                      {BG_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 ${
                            selectedBgColor === color ? 'border-foreground' : 'border-border'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setSelectedBgColor(color)}
                          data-testid={`bg-color-${color}`}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-display-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                type="submit"
                className="flex-1"
                disabled={updateProfileMutation.isPending}
                data-testid="button-save-profile"
              >
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                data-testid="button-cancel-profile"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
