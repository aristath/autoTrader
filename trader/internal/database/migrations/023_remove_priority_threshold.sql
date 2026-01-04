-- Migration 023: Remove priority_threshold column from planner_settings
--
-- This migration removes the priority_threshold column from planner_settings table.
-- Priority threshold filtering has been removed from the planner logic.

-- Drop the priority_threshold column from planner_settings table
ALTER TABLE planner_settings DROP COLUMN IF EXISTS priority_threshold;
