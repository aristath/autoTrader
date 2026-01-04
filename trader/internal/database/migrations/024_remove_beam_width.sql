-- Migration 024: Remove beam_width column from planner_settings
--
-- This migration removes the beam_width column from planner_settings table.
-- Beam search algorithm was not migrated from Python to Go implementation.

-- Drop the beam_width column from planner_settings table
ALTER TABLE planner_settings DROP COLUMN IF EXISTS beam_width;
