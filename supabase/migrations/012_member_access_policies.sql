-- Grant members full read/write access to their car's data
-- This allows invited members to participate fully in the app

-- ============================================================================
-- MEMBERS TABLE - Add read access for fellow members
-- ============================================================================

-- Members can read other members of the same car
CREATE POLICY "Members can read other members of same car"
  ON members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.car_id = members.car_id
      AND m.user_id = auth.uid()
    )
  );

-- ============================================================================
-- CARS TABLE - Already has correct policy
-- ============================================================================
-- "Users can read own cars and cars they're members of" already exists ✓
-- Members should NOT be able to update/delete cars (only owners can)

-- ============================================================================
-- FUEL FILLS TABLE - Add member write access
-- ============================================================================

-- Already have: "Users can read fuel fills of accessible cars" ✓
-- Already have: "Users can insert fuel fills for accessible cars" ✓
-- These should work for members already since they check membership

-- ============================================================================
-- TRIPS TABLE - Add member write access
-- ============================================================================

-- Already have: "Users can read trips of accessible cars" ✓
-- Already have: "Users can insert trips for accessible cars" ✓
-- These should work for members already since they check membership

-- ============================================================================
-- SETTLEMENTS TABLE - Add member write access
-- ============================================================================

-- Already have: "Users can read settlements of accessible cars" ✓
-- Already have: "Users can insert settlements for accessible cars" ✓
-- These should work for members already since they check membership

-- ============================================================================
-- Summary of member permissions after this migration:
-- ============================================================================
-- ✓ Members can view their car details
-- ✓ Members can view all members of their car
-- ✓ Members can view/add fuel fills
-- ✓ Members can view/add trips
-- ✓ Members can view/add settlements
-- ✗ Members CANNOT update/delete fuel fills, trips, settlements (owner only)
-- ✗ Members CANNOT update/delete car settings (owner only)
-- ✗ Members CANNOT add/remove members (owner only)
