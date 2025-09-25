import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import LessonCreator from './lesson-creator';
import type { Lesson, User } from '@shared/schema';

interface LessonsPanelProps {
  spaceId: string | null;
}

export default function LessonsPanel({ spaceId }: LessonsPanelProps) {
  const [selectedLesson, setSelectedLesson] = useState<(Lesson & { author: User }) | null>(null);
  const [showCreator, setShowCreator] = useState(false);

  const { data: lessons = [] } = useQuery({
    queryKey: ['/api/spaces', spaceId, 'lessons'],
    enabled: !!spaceId,
  });

  const handleCreateLesson = () => {
    setSelectedLesson(null);
    setShowCreator(true);
  };

  const handleEditLesson = (lesson: Lesson & { author: User }) => {
    setSelectedLesson(lesson);
    setShowCreator(true);
  };

  const handleCloseCreator = () => {
    setShowCreator(false);
    setSelectedLesson(null);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getTopicsCount = (topics: any[]) => {
    return topics.length;
  };

  if (!spaceId) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <i className="fas fa-graduation-cap text-4xl text-muted-foreground mb-4"></i>
          <p className="text-muted-foreground">Select a space to view lessons</p>
        </div>
      </div>
    );
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
            <i className="fas fa-plus mr-1"></i>New Lesson
          </Button>
        </div>

        {lessons.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-graduation-cap text-4xl text-muted-foreground mb-4"></i>
            <p className="text-muted-foreground mb-4">No lessons yet</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateLesson}
              data-testid="button-create-first-lesson"
            >
              Create your first lesson
            </Button>
          </div>
        ) : (
          lessons.map((lesson: Lesson & { author: User }) => (
            <div
              key={lesson.id}
              className="bg-muted rounded-lg p-4 cursor-pointer hover:bg-muted/80 transition-colors"
              onClick={() => handleEditLesson(lesson)}
              data-testid={`lesson-${lesson.id}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-foreground truncate">{lesson.title}</h4>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    lesson.status === 'published' 
                      ? 'bg-accent text-accent-foreground' 
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    {lesson.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Show lesson options menu
                    }}
                    data-testid={`lesson-options-${lesson.id}`}
                  >
                    <i className="fas fa-ellipsis-h"></i>
                  </Button>
                </div>
              </div>
              
              {lesson.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {lesson.description}
                </p>
              )}
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>
                  <i className="fas fa-user mr-1"></i>
                  {lesson.author.displayName}
                </span>
                <span>
                  <i className="fas fa-clock mr-1"></i>
                  {formatDate(lesson.updatedAt!)}
                </span>
                <span>
                  <i className="fas fa-play-circle mr-1"></i>
                  {getTopicsCount(lesson.topics as any[])} topics
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lesson Creator Modal */}
      <LessonCreator
        isOpen={showCreator}
        lesson={selectedLesson}
        spaceId={spaceId}
        onClose={handleCloseCreator}
      />
    </>
  );
}
