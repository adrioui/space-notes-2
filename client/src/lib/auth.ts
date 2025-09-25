import { apiCall } from './supabase';
import type { User } from '@shared/schema';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export async function sendOTP(contact: string) {
  return apiCall('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ contact }),
  });
}

export async function verifyOTP(contact: string, otp: string) {
  return apiCall('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ contact, otp }),
  });
}

export async function completeProfile(profileData: any) {
  return apiCall('/auth/complete-profile', {
    method: 'POST',
    body: JSON.stringify(profileData),
  });
}

export async function getCurrentUser(): Promise<{ user: User }> {
  return apiCall('/auth/me');
}

export async function logout() {
  return apiCall('/auth/logout', {
    method: 'POST',
  });
}
