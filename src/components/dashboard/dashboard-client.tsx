'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Sidebar from '@/components/layout/sidebar-client'
import ChatSection from '@/components/chat/chat-section-client'
import NotesPanel from '@/components/notes/notes-panel-client'
import LessonsPanel from '@/components/lessons/lessons-panel-client'
import { ErrorBoundary } from 'react-error-boundary'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ConnectionDebugPanel } from '@/components/ui/connection-status'
import type { Space } from '@shared/schema'

export default function DashboardClient() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'notes' | 'lessons'>('notes')

  const {
    data: spaces = [],
    isLoading: spacesLoading,
    error: spacesError,
    refetch: refetchSpaces
  } = useQuery<Space[]>({
    queryKey: ['/api/spaces'],
    enabled: status === 'authenticated',
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.status === 401) return false
      return failureCount < 2
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  useEffect(() => {
    if (spaces.length > 0 && !selectedSpaceId) {
      setSelectedSpaceId(spaces[0].id)
    }
  }, [spaces, selectedSpaceId])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  // Show loading state for spaces
  if (spacesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex">
          <div className="w-64 border-r bg-muted/10 p-4">
            <Skeleton className="h-8 w-32 mb-4" />
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
          <div className="flex-1 p-4">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state for spaces
  if (spacesError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-lg font-semibold text-destructive">Failed to load spaces</h2>
          <p className="text-muted-foreground">
            {spacesError instanceof Error ? spacesError.message : 'An unexpected error occurred'}
          </p>
          <Button onClick={() => refetchSpaces()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const selectedSpace = spaces.find((space: Space) => space.id === selectedSpaceId)

  return (
    <ErrorBoundary fallback={<div className="p-4 text-center text-red-600">Something went wrong with the dashboard</div>}>
      <div className="min-h-screen bg-background" data-testid="dashboard">
        <ErrorBoundary fallback={<div className="p-4 text-center text-red-600">Sidebar error</div>}>
          <Sidebar
            spaces={spaces}
            selectedSpaceId={selectedSpaceId}
            onSelectSpace={setSelectedSpaceId}
          />
        </ErrorBoundary>

        <div className="ml-64 flex h-screen">
          <ErrorBoundary fallback={<div className="p-4 text-center text-red-600">Chat error</div>}>
            <ChatSection spaceId={selectedSpaceId} space={selectedSpace} />
          </ErrorBoundary>

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

            <div className="flex-1 overflow-hidden">
              <ErrorBoundary fallback={<div className="p-4 text-center text-red-600">Panel error</div>}>
                {activeTab === 'notes' ? (
                  <NotesPanel spaceId={selectedSpaceId} />
                ) : (
                  <LessonsPanel spaceId={selectedSpaceId} />
                )}
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>

      {/* Global connection debug panel for development */}
      <ConnectionDebugPanel />
    </ErrorBoundary>
  )
}