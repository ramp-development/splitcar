-- Create a function that allows members to get all members of their car
-- This bypasses RLS and solves the infinite recursion problem

CREATE OR REPLACE FUNCTION public.get_car_members(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  car_id UUID,
  name TEXT,
  phone TEXT,
  user_id UUID,
  is_guest BOOLEAN,
  archived BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_car_id UUID;
BEGIN
  -- First, find the car this user has access to (either as owner or member)
  SELECT cars.id INTO v_car_id
  FROM cars
  WHERE cars.owner_id = p_user_id
  LIMIT 1;

  -- If not an owner, check if they're a member
  IF v_car_id IS NULL THEN
    SELECT m.car_id INTO v_car_id
    FROM members m
    WHERE m.user_id = p_user_id
    LIMIT 1;
  END IF;

  -- If they have access to a car, return all members of that car
  IF v_car_id IS NOT NULL THEN
    RETURN QUERY
    SELECT
      m.id,
      m.car_id,
      m.name,
      m.phone,
      m.user_id,
      m.is_guest,
      m.archived,
      m.created_at
    FROM members m
    WHERE m.car_id = v_car_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_car_members(UUID) TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION public.get_car_members(UUID) IS
'Returns all members of the car that the given user has access to (either as owner or member). Bypasses RLS to avoid infinite recursion.';
