// This would normally contain Supabase client setup
// For now, using fetch-based API calls to our Express backend

export const API_BASE_URL = '/api';

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

export async function uploadFile(file: File, path: string) {
  // In production, this would upload to Supabase Storage
  // For now, create a blob URL for demo purposes
  return URL.createObjectURL(file);
}
