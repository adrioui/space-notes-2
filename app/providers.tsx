'use client'

import { QueryClient, QueryClientProvider, type QueryFunctionContext } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { useEffect, useState, type ReactNode } from 'react'
import ErrorBoundary from '@/components/error-boundary'

// Default query function that handles API calls
const defaultQueryFn = async ({ queryKey }: QueryFunctionContext) => {
  const res = await fetch((queryKey as string[]).join('/'), {
    credentials: 'include',
  })

  if (!res.ok) {
    const error = new Error(`${res.status}: ${res.statusText}`)
    ;(error as any).status = res.status
    throw error
  }

  return await res.json()
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: defaultQueryFn,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false
          }
          // Retry up to 2 times for other errors
          return failureCount < 2
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: (failureCount, error: any) => {
          // Don't retry mutations on client errors
          if (error?.status >= 400 && error?.status < 500) {
            return false
          }
          return failureCount < 1
        },
      },
    },
  }))

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 Providers component mounted')
      console.log('🔧 Environment check:')
      console.log('  - NEXTAUTH_URL:', process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'not set')
    }
  }, [])

  return (
    <ErrorBoundary>
      <SessionProvider
        basePath="/api/auth"
        refetchInterval={5 * 60 * 1000} // Refetch every 5 minutes instead of disabled
      >
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <ErrorBoundary>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
              </ThemeProvider>
            </ErrorBoundary>
          </QueryClientProvider>
        </ErrorBoundary>
      </SessionProvider>
    </ErrorBoundary>
  )
}