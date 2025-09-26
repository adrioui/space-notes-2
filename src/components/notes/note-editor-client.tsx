'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import type { Note, User } from '@shared/schema'

const noteSchema = z.object({
  title: z.string().min(1, 'Note title is required'),
  status: z.enum(['draft', 'published']),
  blocks: z.array(z.object({
    id: z.string(),
    type: z.string(),
    content: z.string(),
  })),
})

type NoteForm = z.infer<typeof noteSchema>

interface NoteEditorClientProps {
  spaceId: string
  note?: (Note & { author: User }) | null
  isOpen: boolean
  onClose: () => void
}

export default function NoteEditorClient({ spaceId, note, isOpen, onClose }: NoteEditorClientProps) {
  const [blocks, setBlocks] = useState([
    { id: '1', type: 'text', content: '' }
  ])
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  const form = useForm<NoteForm>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: '',
      status: 'draft',
      blocks: blocks,
    },
  })

  useEffect(() => {
    if (note) {
      form.setValue('title', note.title)
      form.setValue('status', note.status as 'draft' | 'published')
      const noteBlocks = Array.isArray(note.blocks) ? note.blocks : []
      setBlocks(noteBlocks.length > 0 ? noteBlocks : [{ id: '1', type: 'text', content: '' }])
    } else {
      form.reset()
      setBlocks([{ id: '1', type: 'text', content: '' }])
    }
  }, [note, form])

  const saveNoteMutation = useMutation({
    mutationFn: async (data: NoteForm) => {
      const url = note 
        ? `/api/notes/${note.id}`
        : `/api/spaces/${spaceId}/notes`
      
      const method = note ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, blocks }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to ${note ? 'update' : 'create'} note`)
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spaces', spaceId, 'notes'] })
      toast({
        title: note ? 'Note Updated' : 'Note Created',
        description: `Your note has been ${note ? 'updated' : 'created'} successfully.`,
      })
      onClose()
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      })
    },
  })

  const handleSubmit = (data: NoteForm) => {
    saveNoteMutation.mutate({ ...data, blocks })
  }

  const addBlock = (type: string) => {
    const newBlock = {
      id: `block-${Date.now()}`,
      type,
      content: '',
    }
    setBlocks([...blocks, newBlock])
  }

  const updateBlock = (id: string, content: string) => {
    setBlocks(blocks.map(block => 
      block.id === id ? { ...block, content } : block
    ))
  }

  const removeBlock = (id: string) => {
    if (blocks.length > 1) {
      setBlocks(blocks.filter(block => block.id !== id))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {note ? 'Edit Note' : 'Create New Note'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter note title..."
                      disabled={saveNoteMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Blocks */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Content Blocks</FormLabel>
                <div className="space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addBlock('text')}
                  >
                    <i className="fas fa-font mr-2"></i>
                    Text
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addBlock('todo')}
                  >
                    <i className="fas fa-check-square mr-2"></i>
                    Todo
                  </Button>
                </div>
              </div>

              {blocks.map((block, index) => (
                <div key={block.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      {block.type === 'text' ? 'Text Block' : 'Todo Block'} #{index + 1}
                    </span>
                    {blocks.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBlock(block.id)}
                      >
                        <i className="fas fa-trash text-destructive"></i>
                      </Button>
                    )}
                  </div>
                  
                  <Textarea
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, e.target.value)}
                    placeholder={block.type === 'text' ? 'Enter your text...' : 'Enter todo items...'}
                    rows={4}
                    disabled={saveNoteMutation.isPending}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={saveNoteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveNoteMutation.isPending}
              >
                {saveNoteMutation.isPending 
                  ? (note ? 'Updating...' : 'Creating...') 
                  : (note ? 'Update Note' : 'Create Note')
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}