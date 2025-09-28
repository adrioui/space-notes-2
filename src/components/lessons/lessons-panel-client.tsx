'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import LessonEditor from './lesson-editor-client'
import type { Lesson, User } from '@shared/schema'

interface LessonsPanelClientProps {
  spaceId: string | null
}

export default function LessonsPanelClient({ spaceId }: LessonsPanelClientProps) {
  const [selectedLesson, setSelectedLesson] = useState<(Lesson & { author: User }) | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  const { data: lessons = [] } = useQuery<(Lesson & { author: User })[]>({
    queryKey: ['/api/spaces', spaceId, 'lessons'],
    enabled: !!spaceId,
  })

  const handleCreateLesson = () => {
    setSelectedLesson(null)
    setShowEditor(true)
  }

  const handleEditLesson = (lesson: Lesson & { author: User }) => {
    setSelectedLesson(lesson)
    setShowEditor(true)
  }

  const handleCloseEditor = () => {
    setShowEditor(false)
    setSelectedLesson(null)
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getTopicsCount = (topics: any[]) => {
    return topics?.length || 0
  }

  if (!spaceId) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <i className="fas fa-graduation-cap text-4xl text-muted-foreground mb-4"></i>
          <p className="text-muted-foreground">Select a space to view lessons</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Lessons</h3>
          <Button
            size="sm"
            onClick={handleCreateLesson}
            data-testid="button-create-lesson"
          >
            <i className="fas fa-plus mr-2"></i>
            New Lesson
          </Button>
        </div>

        {lessons.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-graduation-cap text-4xl text-muted-foreground mb-4"></i>
            <h4 className="font-medium text-foreground mb-2">No lessons yet</h4>
            <p className="text-muted-foreground mb-4">
              Create your first lesson to start teaching and sharing knowledge
            </p>
            <Button
              onClick={handleCreateLesson}
              data-testid="button-create-first-lesson"
            >
              <i className="fas fa-plus mr-2"></i>
              Create Lesson
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="p-3 bg-card border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => handleEditLesson(lesson)}
                data-testid={`lesson-${lesson.id}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-foreground truncate flex-1">
                    {lesson.title || 'Untitled Lesson'}
                  </h4>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    {lesson.status === 'published' && (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Published
                      </span>
                    )}
                    <span>{lesson.updatedAt ? formatDate(lesson.updatedAt) : 'No date'}</span>
                  </div>
                </div>
                
                {lesson.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {lesson.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>by {lesson.author.displayName}</span>
                  <span>{getTopicsCount(lesson.topics as any[])} topics</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lesson Editor Modal */}
      {showEditor && (
        <LessonEditor
          spaceId={spaceId}
          lesson={selectedLesson}
          isOpen={showEditor}
          onClose={handleCloseEditor}
        />
      )}
    </>
  )
}