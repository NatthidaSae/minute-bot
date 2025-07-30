-- Migration: Add index for case-insensitive meeting title search
-- This improves performance when grouping transcripts by meeting title

-- Add index on lower-cased title for efficient case-insensitive searches
CREATE INDEX IF NOT EXISTS idx_meetings_title_lower ON meetings(LOWER(title));

-- Add composite index for user_id and lower title for better query performance
CREATE INDEX IF NOT EXISTS idx_meetings_user_title_lower ON meetings(user_id, LOWER(title));