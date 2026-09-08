import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  end_time?: string
  location: string
  attendees: string
  rating: string
  tag: string
  custom_category?: string
  status: 'upcoming' | 'live' | 'ended' | 'completed'
  image_url?: string
  max_registrations?: number
  has_slots?: boolean
  google_sheet_url?: string
  created_at: string
  updated_at: string
}

export interface EventRegistration {
  id: string
  event_id: string
  name: string
  email: string
  discord_id?: string
  // Project showcase fields
  registration_no?: string
  department?: string
  year?: string
  section?: string
  clan?: string
  project_title?: string
  project_category?: string
  project_description?: string
  // Weekly bash
  attending?: boolean
  registered_at: string
}

export interface User {
  id: string
  discord_user_id: string
  username: string
  is_clan_member: boolean
  joined_at: string
  last_active?: string
  avatar_url?: string
}

export interface Birthday {
  id: string
  user_id: string
  name: string
  date: string
  created_at: string
}

export interface Moderator {
  id: string
  email: string
  username: string
  password_hash: string
  is_admin: boolean
  added_at: string
  added_by: string | null
}

export interface MemberProject {
  id: string
  user_id: string // Discord User ID
  title: string
  description: string
  link?: string
  github?: string
  tags: string[]
  image_url?: string
  created_at: string
}

// Quiz System Types
export interface QuizUser {
  id: string
  email: string
  name: string
  password_hash: string
  is_banned: boolean
  created_at: string
  last_login?: string
}

export interface Quiz {
  id: string
  title: string
  description?: string
  created_by?: string
  is_active: boolean
  start_time?: string
  end_time?: string
  time_limit_minutes: number
  created_at: string
  updated_at: string
  quiz_type: 'self_paced' | 'live'
  is_live_active: boolean
  current_question_id?: string
  question_start_time?: string
}

export interface QuizQuestion {
  id: string
  quiz_id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: 'A' | 'B' | 'C' | 'D'
  points: number
  question_order: number
  created_at: string
  time_limit_seconds: number
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  user_id: string
  started_at: string
  submitted_at?: string
  total_score: number
  time_taken_seconds?: number
  tab_switches: number
  is_submitted: boolean
}

export interface QuizAnswer {
  id: string
  attempt_id: string
  question_id: string
  selected_answer?: 'A' | 'B' | 'C' | 'D'
  is_correct: boolean
  answered_at: string
  response_time_seconds?: number
}

export interface QuizLeaderboardEntry {
  id: string
  quiz_id: string
  user_id: string
  attempt_id: string
  score: number
  time_taken_seconds: number
  rank?: number
  is_hidden: boolean
  is_removed: boolean
  created_at: string
  avg_response_time?: number
  // Joined fields
  user_name?: string
  user_email?: string
}

// Hash function for passwords using base64 encoding
// Format: base64(email:password) - simple but effective for this use case
export function hashPassword(email: string, password: string): string {
  return btoa(email + ':' + password)
}

// Verify password against hash
export function verifyPassword(email: string, password: string, hash: string): boolean {
  return hashPassword(email, password) === hash
}

// Slot System Types
export interface EventSlot {
  id: string
  event_id: string
  day_number: number
  slot_date: string
  start_time: string
  end_time: string
  capacity: number
  created_at: string
}

export interface EventSlotRegistration {
  id: string
  slot_id: string
  event_id: string
  user_email: string
  event_registration_id: string
  created_at: string
}
