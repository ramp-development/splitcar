-- Clean up RLS policies after implementing auto-link function
-- The auto-link now uses a SECURITY DEFINER function, so we don't need special RLS policies

-- Remove the auto-link RLS policies (no longer needed since we're using the function approach)
DROP POLICY IF EXISTS "Users can read members with matching phone for auto-link" ON members;
DROP POLICY IF EXISTS "Users can link themselves to members with matching phone" ON members;

-- Summary of RLS policies after cleanup:
-- ✓ Cars: Users can read cars they own OR are members of
-- ✓ Cars: Only owners can insert/update/delete cars
-- ✓ Members: Users can read members of cars they have access to
-- ✓ Members: Only car owners can insert/update/delete members
-- ✓ Fuel/Trips/Settlements: Users can read/insert for accessible cars
-- ✓ Fuel/Trips/Settlements: Only car owners can update/delete
-- ✓ Users: Users can read/update/insert their own record
-- ✓ Auto-linking: Handled by auto_link_member_by_phone() function with SECURITY DEFINER
