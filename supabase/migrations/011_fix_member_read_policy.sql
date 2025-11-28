-- Add a policy that allows users to read their own member records
-- This fixes the circular dependency issue where users can't find which car they're a member of

CREATE POLICY "Users can read their own member records"
  ON members FOR SELECT
  USING (user_id = auth.uid());

-- This policy allows users to directly query:
-- SELECT * FROM members WHERE user_id = auth.uid()
-- which is needed by getUserCarId() to find which car they belong to
