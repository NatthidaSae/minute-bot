-- Migration: Convert existing meeting times from UTC to Asia/Bangkok (UTC+7)
-- Date: 2025-07-31
-- Purpose: Convert all existing meeting times to UTC+7 and update timezone

-- Update timezone for all existing meetings
UPDATE meetings 
SET timezone = 'Asia/Bangkok' 
WHERE timezone = 'UTC' OR timezone IS NULL;

-- Convert existing meeting times from UTC to UTC+7
-- This adds 7 hours to the time and adjusts the date if necessary
UPDATE meetings 
SET 
  meeting_time = CASE
    -- When adding 7 hours doesn't exceed 24 hours
    WHEN meeting_time IS NOT NULL AND 
         EXTRACT(HOUR FROM meeting_time) + 7 < 24 
    THEN (meeting_time + INTERVAL '7 hours')::TIME
    
    -- When adding 7 hours exceeds 24 hours (need to wrap around)
    WHEN meeting_time IS NOT NULL AND 
         EXTRACT(HOUR FROM meeting_time) + 7 >= 24 
    THEN ((meeting_time + INTERVAL '7 hours') - INTERVAL '24 hours')::TIME
    
    ELSE meeting_time
  END,
  
  -- Adjust the date when time crosses midnight
  meeting_date = CASE
    WHEN meeting_time IS NOT NULL AND 
         EXTRACT(HOUR FROM meeting_time) + 7 >= 24 
    THEN meeting_date + INTERVAL '1 day'
    
    ELSE meeting_date
  END
WHERE meeting_time IS NOT NULL;

-- Update timestamps to reflect the conversion
UPDATE meetings 
SET updated_at = NOW() 
WHERE meeting_time IS NOT NULL;

-- Create an index on timezone for better query performance
CREATE INDEX IF NOT EXISTS idx_meetings_timezone ON meetings(timezone);