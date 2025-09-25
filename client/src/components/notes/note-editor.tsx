import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiCall } from '@/lib/supabase';
import BlockEditor from './block-editor';
import PublishModal from '@/components/modals/publish-modal';
import type { Note, User } from '@shared/schema';

interface NoteEditorProps {
  isOpen: boolean;
  note: (Note & { author: User }) | null;
  spaceId: string;
  onClose: () => void;
}

export default function NoteEditor({ isOpen, note, spaceId, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<any[]>([]);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Initialize form data
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setBlocks(note.blocks as any[]);
    } else {
      setTitle('');
      setBlocks([{ id: 'block-1', type: 'text', content: '' }]);
    }
  }, [note]);

  const createNoteMutation = useMutation({
    mutationFn: (data: any) => apiCall(`/spaces/${spaceId}/notes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spaces', spaceId, 'notes'] });
      toast({
        title: 'Note Created',
        description: 'Your note has been saved successfully.',
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

  const updateNoteMutation = useMutation({
    mutationFn: (data: any) => apiCall(`/notes/${note?.id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spaces', spaceId, 'notes'] });
      toast({
        title: 'Note Updated',
        description: 'Your note has been saved successfully.',
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

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a title for your note.',
      });
      return;
    }

    const noteData = {
      title: title.trim(),
      blocks,
      status: 'draft',
    };

    if (note) {
      updateNoteMutation.mutate(noteData);
    } else {
      createNoteMutation.mutate(noteData);
    }
  };

  const handlePublish = (notify: boolean) => {
    if (!title.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a title for your note.',
      });
      return;
    }

    const noteData = {
      title: title.trim(),
      blocks,
      status: 'published',
      notify,
    };

    if (note) {
      updateNoteMutation.mutate(noteData);
    } else {
      createNoteMutation.mutate(noteData);
    }
    
    setShowPublishModal(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-5/6 flex flex-col p-0">
          <DialogHeader className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Untitled Note"
                  className="text-2xl font-bold border-none bg-transparent p-0 focus:ring-0"
                  data-testid="input-note-title"
                />
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={createNoteMutation.isPending || updateNoteMutation.isPending}
                  data-testid="button-save-note"
                >
                  Save Draft
                </Button>
                <Button
                  onClick={() => setShowPublishModal(true)}
                  disabled={createNoteMutation.isPending || updateNoteMutation.isPending}
                  data-testid="button-publish-note"
                >
                  <i className="fas fa-bullhorn mr-2"></i>Publish
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  data-testid="button-close-editor"
                >
                  <i className="fas fa-times"></i>
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <BlockEditor
              blocks={blocks}
              onChange={setBlocks}
            />
          </div>
        </DialogContent>
      </Dialog>

      <PublishModal
        isOpen={showPublishModal}
        contentType="note"
        onPublish={handlePublish}
        onClose={() => setShowPublishModal(false)}
      />
    </>
  );
}
