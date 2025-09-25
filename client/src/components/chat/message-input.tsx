import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiCall, uploadFile } from '@/lib/supabase';

interface MessageInputProps {
  spaceId: string;
}

export default function MessageInput({ spaceId }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const sendMessageMutation = useMutation({
    mutationFn: (data: any) => apiCall(`/spaces/${spaceId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spaces', spaceId, 'messages'] });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    },
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    const messageData = {
      content: message.trim(),
      messageType: 'text',
    };

    setMessage('');
    sendMessageMutation.mutate(messageData);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

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
      const imageUrl = await uploadFile(file, `chat/${spaceId}/${file.name}`);
      
      const messageData = {
        content: message.trim() || undefined,
        messageType: 'image',
        attachments: [{
          type: 'image',
          url: imageUrl,
          name: file.name,
        }],
      };

      setMessage('');
      sendMessageMutation.mutate(messageData);
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

  return (
    <div className="p-4">
      <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          data-testid="button-upload-image"
        >
          <i className={`fas ${isUploading ? 'fa-spinner fa-spin' : 'fa-image'} text-muted-foreground`}></i>
        </Button>
        
        <div className="flex-1">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="bg-muted border-border"
            data-testid="input-message"
          />
        </div>
        
        <Button
          type="submit"
          disabled={!message.trim() || sendMessageMutation.isPending}
          data-testid="button-send-message"
        >
          <i className="fas fa-paper-plane"></i>
        </Button>
      </form>
    </div>
  );
}
