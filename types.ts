export interface User {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  tier_level: number;
  presence_status: 'online' | 'offline' | 'busy' | 'away';
  hours_this_week: number;
  joined_date: string;
  role: 'Member' | 'Admin' | 'Moderator';
  bio?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sender_tier: number;
  created_date: string;
  channel_id: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  type: 'raid' | 'meeting' | 'social' | 'tournament';
  attendees: number;
}

export interface ChatChannel {
  id: string;
  name: string;
  description: string;
  type: 'public' | 'private';
}

// Mock API Response wrapper
export interface ApiResponse<T> {
  data: T;
  error?: string;
}