-- SQL Migration: Add google_sheet_url column to events table
-- Run this query in Supabase SQL Editor

ALTER TABLE events ADD COLUMN IF NOT EXISTS google_sheet_url TEXT;
