'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import NoteEditor from './note-editor-client'
import type { Note, User } from '@shared/schema'

interface NotesPanelClientProps {
  spaceId: string | null
}

export default function NotesPanelClient({ spaceId }: NotesPanelClientProps) {
  const [selectedNote, setSelectedNote] = useState<(Note & { author: User }) | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  const { data: notes = [] } = useQuery<(Note & { author: User })[]>({
    queryKey: ['/api/spaces', spaceId, 'notes'],
    enabled: !!spaceId,
  })

  const handleCreateNote = () => {
    setSelectedNote(null)
    setShowEditor(true)
  }

  const handleEditNote = (note: Note & { author: User }) => {
    setSelectedNote(note)
    setShowEditor(true)
  }

  const handleCloseEditor = () => {
    setShowEditor(false)
    setSelectedNote(null)
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getBlocksPreview = (blocks: any[]) => {
    const textBlocks = blocks.filter(block => block.type === 'text')
    if (textBlocks.length > 0) {
      return textBlocks[0].content?.substring(0, 100) + '...'
    }
    return 'No content preview available'
  }

  const getBlockCount = (blocks: any[]) => {
    return blocks.length
  }

  if (!spaceId) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <i className="fas fa-sticky-note text-4xl text-muted-foreground mb-4"></i>
          <p className="text-muted-foreground">Select a space to view notes</p>
        </div>
      </div>
    )
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
            <i className="fas fa-plus mr-2"></i>
            New Note
          </Button>
        </div>

        {notes.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-sticky-note text-4xl text-muted-foreground mb-4"></i>
            <h4 className="font-medium text-foreground mb-2">No notes yet</h4>
            <p className="text-muted-foreground mb-4">
              Create your first note to start organizing your thoughts
            </p>
            <Button
              onClick={handleCreateNote}
              data-testid="button-create-first-note"
            >
              <i className="fas fa-plus mr-2"></i>
              Create Note
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-3 bg-card border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => handleEditNote(note)}
                data-testid={`note-${note.id}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-foreground truncate flex-1">
                    {note.title || 'Untitled Note'}
                  </h4>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    {note.status === 'published' && (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Published
                      </span>
                    )}
                    <span>{formatDate(note.updatedAt)}</span>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {getBlocksPreview(note.blocks)}
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>by {note.author.displayName}</span>
                  <span>{getBlockCount(note.blocks)} blocks</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note Editor Modal */}
      {showEditor && (
        <NoteEditor
          spaceId={spaceId}
          note={selectedNote}
          isOpen={showEditor}
          onClose={handleCloseEditor}
        />
      )}
    </>
  )
}