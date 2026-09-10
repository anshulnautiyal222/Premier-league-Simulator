-- ==============================================================================
-- Migration: 20260910145300_add_home_ground_name.sql
-- Description: Add home_ground_name to public.clubs for the founding wizard
-- ==============================================================================

ALTER TABLE public.clubs
ADD COLUMN IF NOT EXISTS home_ground_name VARCHAR(100) DEFAULT 'Home Arena';
