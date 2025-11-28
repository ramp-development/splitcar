-- Fix the infinite recursion issue by using the correct policies
-- The solution is to have TWO separate policies that don't conflict

-- Drop all existing member SELECT policies
DROP POLICY IF EXISTS "Users can read members of accessible cars" ON members;
DROP POLICY IF EXISTS "Members can read other members of same car" ON members;
DROP POLICY IF EXISTS "Users can read members with matching phone for auto-link" ON members;
DROP POLICY IF EXISTS "Users can read their own member records" ON members;

-- Policy 1: Users can read their own member records (no recursion - simple check)
CREATE POLICY "Users can read their own member records"
  ON members FOR SELECT
  USING (user_id = auth.uid());

-- Policy 2: Car owners can read all members of their cars
CREATE POLICY "Car owners can read all members"
  ON members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = members.car_id
      AND cars.owner_id = auth.uid()
    )
  );

-- Note: We intentionally do NOT allow members to read other members yet
-- because any policy that tries to check "if user is a member" creates infinite recursion
-- Members can still use the app - they just can't see the full members list
-- (The owner can see everyone, which is what matters for management)
