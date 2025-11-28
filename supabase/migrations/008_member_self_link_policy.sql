-- First, drop the policies if they exist (to allow re-running this migration)
DROP POLICY IF EXISTS "Users can read members with matching phone for auto-link" ON members;
DROP POLICY IF EXISTS "Users can link themselves to members with matching phone" ON members;

-- Temporarily disable the existing "Car owners can update members" policy
-- by dropping and recreating it with additional conditions
DROP POLICY IF EXISTS "Car owners can update members" ON members;

-- Allow users to read members that match their phone number (for auto-linking)
-- Uses the public.users table instead of auth.users to avoid permission issues
CREATE POLICY "Users can read members with matching phone for auto-link"
  ON members FOR SELECT
  USING (
    phone IS NOT NULL AND
    user_id IS NULL AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (
        members.phone = users.phone OR
        members.phone = '+' || users.phone OR
        REPLACE(members.phone, '+', '') = REPLACE(users.phone, '+', '')
      )
    )
  );

-- Allow users to link themselves to members with matching phone number
-- USING clause checks the OLD row (before update)
-- WITH CHECK clause checks the NEW row (after update)
CREATE POLICY "Users can link themselves to members with matching phone"
  ON members FOR UPDATE
  USING (
    -- OLD row: must have no user_id and must have matching phone
    user_id IS NULL AND
    phone IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (
        members.phone = users.phone OR
        members.phone = '+' || users.phone OR
        REPLACE(members.phone, '+', '') = REPLACE(users.phone, '+', '')
      )
    )
  )
  WITH CHECK (
    -- NEW row: just check that user_id was set to current user
    -- Don't re-check phone since it should not be modified
    user_id = auth.uid()
  );

-- Recreate the "Car owners can update members" policy with broader permissions
-- This allows both car owners AND users linking themselves
CREATE POLICY "Car owners can update members"
  ON members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = members.car_id
      AND cars.owner_id = auth.uid()
    )
  );
