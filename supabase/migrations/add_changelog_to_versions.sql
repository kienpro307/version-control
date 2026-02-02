-- Add changelog column to versions table
-- Run this in Supabase SQL Editor

ALTER TABLE versions ADD COLUMN IF NOT EXISTS changelog TEXT;
