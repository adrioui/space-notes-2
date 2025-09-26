'use client'

import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

const toasts = new Map<string, Toast>()
const listeners = new Set<(toasts: Toast[]) => void>()

function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

function notifyListeners() {
  const toastArray = Array.from(toasts.values())
  listeners.forEach(listener => listener(toastArray))
}

export function useToast() {
  const [, setToastList] = useState<Toast[]>([])

  // Subscribe to toast updates
  useState(() => {
    const listener = (newToasts: Toast[]) => setToastList([...newToasts])
    listeners.add(listener)
    return () => listeners.delete(listener)
  })

  const toast = useCallback(({
    title,
    description,
    variant = 'default',
    duration = 5000,
  }: Omit<Toast, 'id'>) => {
    const id = generateId()
    const newToast: Toast = {
      id,
      title,
      description,
      variant,
      duration,
    }

    toasts.set(id, newToast)
    notifyListeners()

    // Auto-remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        toasts.delete(id)
        notifyListeners()
      }, duration)
    }

    return id
  }, [])

  const dismiss = useCallback((toastId: string) => {
    toasts.delete(toastId)
    notifyListeners()
  }, [])

  return {
    toast,
    dismiss,
    toasts: Array.from(toasts.values()),
  }
}