import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import NoteEditor from './note-editor';
import type { Note, User } from '@shared/schema';

interface NotesPanelProps {
  spaceId: string | null;
}

export default function NotesPanel({ spaceId }: NotesPanelProps) {
  const [selectedNote, setSelectedNote] = useState<(Note & { author: User }) | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const { data: notes = [] } = useQuery({
    queryKey: ['/api/spaces', spaceId, 'notes'],
    enabled: !!spaceId,
  });

  const handleCreateNote = () => {
    setSelectedNote(null);
    setShowEditor(true);
  };

  const handleEditNote = (note: Note & { author: User }) => {
    setSelectedNote(note);
    setShowEditor(true);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setSelectedNote(null);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getBlocksPreview = (blocks: any[]) => {
    const textBlocks = blocks.filter(block => block.type === 'text');
    if (textBlocks.length > 0) {
      return textBlocks[0].content?.substring(0, 100) + '...';
    }
    return 'No content preview available';
  };

  const getBlockCount = (blocks: any[]) => {
    return blocks.length;
  };

  if (!spaceId) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <i className="fas fa-sticky-note text-4xl text-muted-foreground mb-4"></i>
          <p className="text-muted-foreground">Select a space to view notes</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Notes</h3>
          <Button
            size="sm"
            onClick={handleCreateNote}
            data-testid="button-create-note"
          >
            <i className="fas fa-plus mr-1"></i>New Note
          </Button>
        </div>

        {notes.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-sticky-note text-4xl text-muted-foreground mb-4"></i>
            <p className="text-muted-foreground mb-4">No notes yet</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateNote}
              data-testid="button-create-first-note"
            >
              Create your first note
            </Button>
          </div>
        ) : (
          notes.map((note: Note & { author: User }) => (
            <div
              key={note.id}
              className="bg-muted rounded-lg p-4 cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => handleEditNote(note)}
              data-testid={`note-${note.id}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-foreground truncate">{note.title}</h4>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    note.status === 'published' 
                      ? 'bg-accent text-accent-foreground' 
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {note.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Show note options menu
                    }}
                    data-testid={`note-options-${note.id}`}
                  >
                    <i className="fas fa-ellipsis-h"></i>
                  </Button>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {getBlocksPreview(note.blocks as any[])}
              </p>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>
                  <i className="fas fa-user mr-1"></i>
                  {note.author.displayName}
                </span>
                <span>
                  <i className="fas fa-clock mr-1"></i>
                  {formatDate(note.updatedAt!)}
                </span>
                <span>
                  <i className="fas fa-cube mr-1"></i>
                  {getBlockCount(note.blocks as any[])} blocks
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Note Editor Modal */}
      <NoteEditor
        isOpen={showEditor}
        note={selectedNote}
        spaceId={spaceId}
        onClose={handleCloseEditor}
      />
    </>
  );
}
