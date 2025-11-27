-- Add name column to trips table
ALTER TABLE trips ADD COLUMN name TEXT;

-- Remove driver_member_id column from trips table (if it exists)
ALTER TABLE trips DROP COLUMN IF EXISTS driver_member_id;
