import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { apiCall } from '@/lib/supabase';

const spaceSchema = z.object({
  name: z.string().min(1, 'Space name is required'),
  description: z.string().optional(),
  emoji: z.string().min(1, 'Please select an emoji'),
  wallpaper: z.string().min(1, 'Please select a wallpaper'),
});

type SpaceForm = z.infer<typeof spaceSchema>;

interface SpaceCreatorProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMOJI_OPTIONS = ['🚀', '📚', '🌱', '🎨', '💡', '🎯', '⚡', '🌟', '🔥', '💪', '🌈', '✨'];
const WALLPAPER_OPTIONS = [
  { value: 'neutral', label: 'Neutral', description: 'Clean and minimal' },
  { value: 'growth', label: 'Growth Doodles', description: 'Organic patterns' },
  { value: 'geometric', label: 'Geometric', description: 'Modern shapes' },
  { value: 'nature', label: 'Nature', description: 'Natural elements' },
];

export default function SpaceCreator({ isOpen, onClose }: SpaceCreatorProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<SpaceForm>({
    resolver: zodResolver(spaceSchema),
    defaultValues: {
      name: '',
      description: '',
      emoji: '🚀',
      wallpaper: 'neutral',
    },
  });

  const createSpaceMutation = useMutation({
    mutationFn: (data: SpaceForm) => apiCall('/spaces', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: (newSpace) => {
      queryClient.invalidateQueries({ queryKey: ['/api/spaces'] });
      toast({
        title: 'Space Created',
        description: `${newSpace.name} has been created successfully.`,
      });
      form.reset();
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

  const handleSubmit = (data: SpaceForm) => {
    createSpaceMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Space</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Emoji Selection */}
            <FormField
              control={form.control}
              name="emoji"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Space Icon</FormLabel>
                  <div className="grid grid-cols-6 gap-2">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <Button
                        key={emoji}
                        type="button"
                        variant={field.value === emoji ? 'default' : 'outline'}
                        size="sm"
                        className="w-10 h-10 p-0"
                        onClick={() => field.onChange(emoji)}
                        data-testid={`space-emoji-${emoji}`}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Space Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Space Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter space name" 
                      {...field} 
                      data-testid="input-space-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What's this space about?"
                      className="resize-none"
                      rows={2}
                      {...field} 
                      data-testid="input-space-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Wallpaper Selection */}
            <FormField
              control={form.control}
              name="wallpaper"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chat Wallpaper</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-wallpaper">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {WALLPAPER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-sm text-muted-foreground">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                type="submit"
                className="flex-1"
                disabled={createSpaceMutation.isPending}
                data-testid="button-create-space"
              >
                {createSpaceMutation.isPending ? 'Creating...' : 'Create Space'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                data-testid="button-cancel-space"
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
