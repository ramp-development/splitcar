-- Rollback the problematic policy and fix it properly
DROP POLICY IF EXISTS "Members can read other members of same car" ON members;

-- The original "Users can read members of accessible cars" policy should work
-- but it has a circular dependency. Let's simplify the members read policies.

-- First, let's drop and recreate the "Users can read members of accessible cars" policy
-- to make it work better
DROP POLICY IF EXISTS "Users can read members of accessible cars" ON members;

-- New simplified approach: Users can read members if they own the car OR have a member record
CREATE POLICY "Users can read members of accessible cars"
  ON members FOR SELECT
  USING (
    -- They can read if they own the car
    EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = members.car_id
      AND cars.owner_id = auth.uid()
    )
    OR
    -- OR if their user_id appears in ANY member record for this car
    -- (meaning they're already a member, so they can see other members)
    members.car_id IN (
      SELECT car_id FROM members WHERE user_id = auth.uid()
    )
  );
