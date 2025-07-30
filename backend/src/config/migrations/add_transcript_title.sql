-- Migration: Add title column to transcripts table
-- Date: 2025-01-29

-- Add title column to transcripts table if it doesn't exist
ALTER TABLE transcripts 
ADD COLUMN IF NOT EXISTS title TEXT;

-- Update existing records to extract title from filename
-- This handles the bracketed pattern: [Org] [Project] Title_Date
UPDATE transcripts
SET title = 
  CASE 
    -- Pattern: [Org] [Project] Title_Date
    WHEN filename ~ '^\[[^\]]+\]\s*\[[^\]]+\]\s*(.+?)_\d{4}-\d{2}-\d{2}'
    THEN regexp_replace(filename, '^\[[^\]]+\]\s*\[[^\]]+\]\s*(.+?)_\d{4}-\d{2}-\d{2}.*$', '\1')
    
    -- Pattern: [Org] Title_Date
    WHEN filename ~ '^\[[^\]]+\]\s*(.+?)_\d{4}-\d{2}-\d{2}'
    THEN regexp_replace(filename, '^\[[^\]]+\]\s*(.+?)_\d{4}-\d{2}-\d{2}.*$', '\1')
    
    -- Pattern: Title_Date
    WHEN filename ~ '^(.+?)_\d{4}-\d{2}-\d{2}'
    THEN regexp_replace(filename, '^(.+?)_\d{4}-\d{2}-\d{2}.*$', '\1')
    
    -- Default: use filename without extension
    ELSE regexp_replace(filename, '\.(txt|docx)$', '', 'i')
  END
WHERE title IS NULL;