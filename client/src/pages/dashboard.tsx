import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { apiCall } from '@/lib/supabase';
import Sidebar from '@/components/layout/sidebar';
import ChatSection from '@/components/chat/chat-section';
import NotesPanel from '@/components/notes/notes-panel';
import LessonsPanel from '@/components/lessons/lessons-panel';
import type { Space } from '@shared/schema';

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'notes' | 'lessons'>('notes');

  const { data: spaces = [] } = useQuery({
    queryKey: ['/api/spaces'],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, isLoading, setLocation]);

  useEffect(() => {
    if (spaces.length > 0 && !selectedSpaceId) {
      setSelectedSpaceId(spaces[0].id);
    }
  }, [spaces, selectedSpaceId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const selectedSpace = spaces.find((space: Space) => space.id === selectedSpaceId);

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard">
      <Sidebar 
        spaces={spaces}
        selectedSpaceId={selectedSpaceId}
        onSelectSpace={setSelectedSpaceId}
      />
      
      <div className="ml-64 flex h-screen">
        <ChatSection spaceId={selectedSpaceId} space={selectedSpace} />
        
        <div className="w-96 bg-card border-l border-border flex flex-col">
          {/* Tab Navigation */}
          <div className="border-b border-border">
            <div className="flex">
              <button 
                className={`flex-1 py-3 px-4 text-center border-b-2 font-medium ${
                  activeTab === 'notes' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab('notes')}
                data-testid="tab-notes"
              >
                <i className="fas fa-sticky-note mr-2"></i>Notes
              </button>
              <button 
                className={`flex-1 py-3 px-4 text-center border-b-2 font-medium ${
                  activeTab === 'lessons' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveTab('lessons')}
                data-testid="tab-lessons"
              >
                <i className="fas fa-graduation-cap mr-2"></i>Lessons
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'notes' ? (
              <NotesPanel spaceId={selectedSpaceId} />
            ) : (
              <LessonsPanel spaceId={selectedSpaceId} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
