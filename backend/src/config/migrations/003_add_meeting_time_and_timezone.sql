-- Migration: Add meeting_time and timezone columns to meetings table
-- Date: 2025-07-31
-- Purpose: Support time tracking for meetings and prepare for Google Calendar integration

-- Add meeting_time column to meetings table if it doesn't exist
ALTER TABLE meetings 
ADD COLUMN IF NOT EXISTS meeting_time TIME;

-- Add timezone column with default Asia/Bangkok
ALTER TABLE meetings 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Bangkok';

-- Drop existing constraint if it exists (to recreate with new columns)
ALTER TABLE meetings 
DROP CONSTRAINT IF EXISTS unique_meeting_per_user_per_day;

-- Add unique constraint to prevent duplicate meetings at the same time
ALTER TABLE meetings 
ADD CONSTRAINT unique_meeting_per_user_per_datetime 
UNIQUE (title, meeting_date, meeting_time, user_id);

-- Update existing meetings to extract time from their transcripts
-- This looks for the first transcript's filename to extract the time component
UPDATE meetings m
SET meeting_time = 
  CASE 
    -- Extract time from _2025-07-17T02_54_32+00_00 format
    WHEN t.filename ~ '_\d{4}-\d{2}-\d{2}T(\d{2})_(\d{2})_(\d{2})'
    THEN regexp_replace(t.filename, '.*_\d{4}-\d{2}-\d{2}T(\d{2})_(\d{2})_(\d{2}).*', '\1:\2:\3')::TIME
    
    -- Default to NULL if no time pattern found
    ELSE NULL
  END
FROM (
  SELECT DISTINCT ON (meeting_id) 
    meeting_id, 
    filename
  FROM transcripts
  ORDER BY meeting_id, created_at ASC
) t
WHERE m.id = t.meeting_id 
  AND m.meeting_time IS NULL;

-- Create index on meeting_time for better query performance
CREATE INDEX IF NOT EXISTS idx_meetings_time ON meetings(meeting_time);
CREATE INDEX IF NOT EXISTS idx_meetings_date_time ON meetings(meeting_date, meeting_time);