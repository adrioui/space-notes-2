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
import type { Lesson, User } from '@shared/schema'

const lessonSchema = z.object({
  title: z.string().min(1, 'Lesson title is required'),
  description: z.string().optional(),
  status: z.enum(['draft', 'published']),
  topics: z.array(z.object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    type: z.string(),
  })),
})

type LessonForm = z.infer<typeof lessonSchema>

interface LessonEditorClientProps {
  spaceId: string
  lesson?: (Lesson & { author: User }) | null
  isOpen: boolean
  onClose: () => void
}

export default function LessonEditorClient({ spaceId, lesson, isOpen, onClose }: LessonEditorClientProps) {
  const [topics, setTopics] = useState([
    { id: '1', title: '', content: '', type: 'text' }
  ])
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  const form = useForm<LessonForm>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: '',
      description: '',
      status: 'draft',
      topics: topics,
    },
  })

  useEffect(() => {
    if (lesson) {
      form.setValue('title', lesson.title)
      form.setValue('description', lesson.description || '')
      form.setValue('status', lesson.status as 'draft' | 'published')
      const lessonTopics = Array.isArray(lesson.topics) ? lesson.topics : []
      setTopics(lessonTopics.length > 0 ? lessonTopics : [{ id: '1', title: '', content: '', type: 'text' }])
    } else {
      form.reset()
      setTopics([{ id: '1', title: '', content: '', type: 'text' }])
    }
  }, [lesson, form])

  const saveLessonMutation = useMutation({
    mutationFn: async (data: LessonForm) => {
      const url = lesson 
        ? `/api/lessons/${lesson.id}`
        : `/api/spaces/${spaceId}/lessons`
      
      const method = lesson ? 'PATCH' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, topics }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to ${lesson ? 'update' : 'create'} lesson`)
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spaces', spaceId, 'lessons'] })
      toast({
        title: lesson ? 'Lesson Updated' : 'Lesson Created',
        description: `Your lesson has been ${lesson ? 'updated' : 'created'} successfully.`,
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

  const handleSubmit = (data: LessonForm) => {
    saveLessonMutation.mutate({ ...data, topics })
  }

  const addTopic = (type: string) => {
    const newTopic = {
      id: `topic-${Date.now()}`,
      title: '',
      content: '',
      type,
    }
    setTopics([...topics, newTopic])
  }

  const updateTopic = (id: string, field: string, value: string) => {
    setTopics(topics.map(topic => 
      topic.id === id ? { ...topic, [field]: value } : topic
    ))
  }

  const removeTopic = (id: string) => {
    if (topics.length > 1) {
      setTopics(topics.filter(topic => topic.id !== id))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {lesson ? 'Edit Lesson' : 'Create New Lesson'}
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
                  <FormLabel>Lesson Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter lesson title..."
                      disabled={saveLessonMutation.isPending}
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="What will students learn?"
                      rows={3}
                      disabled={saveLessonMutation.isPending}
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

            {/* Topics */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Lesson Topics</FormLabel>
                <div className="space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addTopic('text')}
                  >
                    <i className="fas fa-font mr-2"></i>
                    Text Topic
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addTopic('video')}
                  >
                    <i className="fas fa-video mr-2"></i>
                    Video Topic
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addTopic('link')}
                  >
                    <i className="fas fa-link mr-2"></i>
                    Link Topic
                  </Button>
                </div>
              </div>

              {topics.map((topic, index) => (
                <div key={topic.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      Topic #{index + 1} ({topic.type})
                    </span>
                    {topics.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTopic(topic.id)}
                      >
                        <i className="fas fa-trash text-destructive"></i>
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <Input
                      value={topic.title}
                      onChange={(e) => updateTopic(topic.id, 'title', e.target.value)}
                      placeholder="Topic title..."
                      disabled={saveLessonMutation.isPending}
                    />
                    
                    <Textarea
                      value={topic.content}
                      onChange={(e) => updateTopic(topic.id, 'content', e.target.value)}
                      placeholder={
                        topic.type === 'text' ? 'Enter content...' :
                        topic.type === 'video' ? 'Enter YouTube URL or video description...' :
                        'Enter link URL and description...'
                      }
                      rows={4}
                      disabled={saveLessonMutation.isPending}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={saveLessonMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveLessonMutation.isPending}
              >
                {saveLessonMutation.isPending 
                  ? (lesson ? 'Updating...' : 'Creating...') 
                  : (lesson ? 'Update Lesson' : 'Create Lesson')
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}