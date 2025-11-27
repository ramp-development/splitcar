-- Add archived column to members table
ALTER TABLE members ADD COLUMN archived BOOLEAN DEFAULT FALSE;

-- Add index for common query pattern (active members)
CREATE INDEX idx_members_archived ON members(archived);
