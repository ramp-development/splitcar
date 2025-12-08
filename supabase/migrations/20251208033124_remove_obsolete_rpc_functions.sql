-- Remove obsolete RPC functions
-- These functions were used to bypass RLS, but are no longer needed
-- since we're using direct queries with RLS disabled during refactor

-- Drop query functions (no longer needed)
DROP FUNCTION IF EXISTS get_user_car(text);
DROP FUNCTION IF EXISTS get_car_members(text);
DROP FUNCTION IF EXISTS get_car_expenses(text);
DROP FUNCTION IF EXISTS get_car_trips(text);
DROP FUNCTION IF EXISTS get_car_settlements(text);

-- Keep these functions as they're still needed:
-- - generate_invite_code() - used by trigger
-- - set_invite_code() - trigger function
-- - set_archived_at() - trigger function
-- - accept_invite() - atomic operation for invite acceptance

COMMENT ON FUNCTION generate_invite_code IS 'Generates unique invite codes for members';
COMMENT ON FUNCTION accept_invite IS 'Atomically accepts an invite and links member to user';
