import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import type { ReactNode } from 'react'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Spaces - Collaborate, Chat & Learn',
  description: 'Real-time collaboration platform with messaging, notes, and lessons',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}