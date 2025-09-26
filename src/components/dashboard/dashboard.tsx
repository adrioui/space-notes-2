'use client'

import { useSession } from 'next-auth/react'

export default function Dashboard() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome to Your Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your spaces, chat with teams, and create content.
          </p>
          
          {session?.user && (
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
              <h2 className="text-lg font-semibold">User Info</h2>
              <p>User ID: {session.user.id}</p>
              <p>Email: {session.user.email}</p>
            </div>
          )}
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Your Spaces</h3>
              <p className="text-gray-600 dark:text-gray-400">No spaces yet</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Recent Messages</h3>
              <p className="text-gray-600 dark:text-gray-400">No messages yet</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Notes & Lessons</h3>
              <p className="text-gray-600 dark:text-gray-400">No content yet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}