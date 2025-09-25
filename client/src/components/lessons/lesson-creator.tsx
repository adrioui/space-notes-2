import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiCall } from '@/lib/supabase';
import PublishModal from '@/components/modals/publish-modal';
import type { Lesson, User } from '@shared/schema';

interface Topic {
  id: string;
  title: string;
  availability: 'always' | 'sequential' | 'date';
  contentType: 'youtube' | 'external';
  url: string;
  notes?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

interface LessonCreatorProps {
  isOpen: boolean;
  lesson: (Lesson & { author: User }) | null;
  spaceId: string;
  onClose: () => void;
}

export default function LessonCreator({ isOpen, lesson, spaceId, onClose }: LessonCreatorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Initialize form data
  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setDescription(lesson.description || '');
      setTopics(lesson.topics as Topic[]);
    } else {
      setTitle('');
      setDescription('');
      setTopics([]);
    }
  }, [lesson]);

  const createLessonMutation = useMutation({
    mutationFn: (data: any) => apiCall(`/spaces/${spaceId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spaces', spaceId, 'lessons'] });
      toast({
        title: 'Lesson Created',
        description: 'Your lesson has been saved successfully.',
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

  const updateLessonMutation = useMutation({
    mutationFn: (data: any) => apiCall(`/lessons/${lesson?.id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/spaces', spaceId, 'lessons'] });
      toast({
        title: 'Lesson Updated',
        description: 'Your lesson has been saved successfully.',
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

  const addTopic = () => {
    const newTopic: Topic = {
      id: `topic-${Date.now()}`,
      title: '',
      availability: 'sequential',
      contentType: 'youtube',
      url: '',
      notes: '',
    };
    setTopics([...topics, newTopic]);
  };

  const updateTopic = (topicId: string, updates: Partial<Topic>) => {
    setTopics(topics.map(topic => 
      topic.id === topicId ? { ...topic, ...updates } : topic
    ));
  };

  const deleteTopic = (topicId: string) => {
    setTopics(topics.filter(topic => topic.id !== topicId));
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a title for your lesson.',
      });
      return;
    }

    if (topics.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please add at least one topic to your lesson.',
      });
      return;
    }

    const lessonData = {
      title: title.trim(),
      description: description.trim() || undefined,
      topics,
      status: 'draft',
    };

    if (lesson) {
      updateLessonMutation.mutate(lessonData);
    } else {
      createLessonMutation.mutate(lessonData);
    }
  };

  const handlePublish = (notify: boolean) => {
    if (!title.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a title for your lesson.',
      });
      return;
    }

    if (topics.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please add at least one topic to your lesson.',
      });
      return;
    }

    const lessonData = {
      title: title.trim(),
      description: description.trim() || undefined,
      topics,
      status: 'published',
      notify,
    };

    if (lesson) {
      updateLessonMutation.mutate(lessonData);
    } else {
      createLessonMutation.mutate(lessonData);
    }
    
    setShowPublishModal(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl h-5/6 flex flex-col p-0">
          <DialogHeader className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Course Title"
                  className="text-2xl font-bold border-none bg-transparent p-0 focus:ring-0"
                  data-testid="input-lesson-title"
                />
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Course description..."
                  className="bg-transparent border-none resize-none focus:ring-0 p-0 text-muted-foreground"
                  rows={2}
                  data-testid="input-lesson-description"
                />
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={createLessonMutation.isPending || updateLessonMutation.isPending}
                  data-testid="button-save-lesson"
                >
                  Save Draft
                </Button>
                <Button
                  onClick={() => setShowPublishModal(true)}
                  disabled={createLessonMutation.isPending || updateLessonMutation.isPending}
                  data-testid="button-publish-lesson"
                >
                  <i className="fas fa-bullhorn mr-2"></i>Publish
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  data-testid="button-close-lesson-creator"
                >
                  <i className="fas fa-times"></i>
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Course Topics</h3>
                <Button
                  onClick={addTopic}
                  data-testid="button-add-topic"
                >
                  <i className="fas fa-plus mr-2"></i>Add Topic
                </Button>
              </div>

              {topics.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                  <i className="fas fa-play-circle text-4xl text-muted-foreground mb-4"></i>
                  <p className="text-muted-foreground mb-4">No topics yet</p>
                  <Button
                    variant="outline"
                    onClick={addTopic}
                    data-testid="button-add-first-topic"
                  >
                    Add your first topic
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {topics.map((topic, index) => (
                    <div key={topic.id} className="bg-muted rounded-lg p-4" data-testid={`topic-${topic.id}`}>
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 space-y-3">
                          <Input
                            value={topic.title}
                            onChange={(e) => updateTopic(topic.id, { title: e.target.value })}
                            placeholder="Topic title"
                            className="font-medium"
                            data-testid={`topic-title-${topic.id}`}
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Availability
                              </label>
                              <Select
                                value={topic.availability}
                                onValueChange={(value: 'always' | 'sequential' | 'date') => 
                                  updateTopic(topic.id, { availability: value })
                                }
                              >
                                <SelectTrigger data-testid={`topic-availability-${topic.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="always">Always Available</SelectItem>
                                  <SelectItem value="sequential">Sequential Unlock</SelectItem>
                                  <SelectItem value="date">Custom Date Range</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Content Type
                              </label>
                              <Select
                                value={topic.contentType}
                                onValueChange={(value: 'youtube' | 'external') => 
                                  updateTopic(topic.id, { contentType: value })
                                }
                              >
                                <SelectTrigger data-testid={`topic-content-type-${topic.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="youtube">YouTube Video</SelectItem>
                                  <SelectItem value="external">External Link</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Input
                              value={topic.url}
                              onChange={(e) => updateTopic(topic.id, { url: e.target.value })}
                              placeholder={topic.contentType === 'youtube' ? 'YouTube URL' : 'External URL'}
                              data-testid={`topic-url-${topic.id}`}
                            />
                            <Textarea
                              value={topic.notes || ''}
                              onChange={(e) => updateTopic(topic.id, { notes: e.target.value })}
                              placeholder="Optional material notes..."
                              rows={2}
                              className="resize-none"
                              data-testid={`topic-notes-${topic.id}`}
                            />
                          </div>

                          {topic.availability === 'sequential' && index > 0 && (
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <i className="fas fa-lock"></i>
                              <span>Unlocks after Topic {index} completion</span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTopic(topic.id)}
                          data-testid={`delete-topic-${topic.id}`}
                        >
                          <i className="fas fa-trash text-muted-foreground hover:text-destructive"></i>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PublishModal
        isOpen={showPublishModal}
        contentType="lesson"
        onPublish={handlePublish}
        onClose={() => setShowPublishModal(false)}
      />
    </>
  );
}
