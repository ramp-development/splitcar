-- Create a function that allows users to get settlements for their car
-- This bypasses RLS and solves permission issues

CREATE OR REPLACE FUNCTION public.get_car_settlements(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  car_id UUID,
  from_member_id UUID,
  to_member_id UUID,
  from_member_name TEXT,
  to_member_name TEXT,
  amount NUMERIC,
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

  -- If they have access to a car, return all settlements with member names
  IF v_car_id IS NOT NULL THEN
    RETURN QUERY
    SELECT
      s.id,
      s.car_id,
      s.from_member_id,
      s.to_member_id,
      m1.name as from_member_name,
      m2.name as to_member_name,
      s.amount,
      s.created_at
    FROM settlements s
    LEFT JOIN members m1 ON m1.id = s.from_member_id
    LEFT JOIN members m2 ON m2.id = s.to_member_id
    WHERE s.car_id = v_car_id
    ORDER BY s.created_at DESC;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_car_settlements(UUID) TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION public.get_car_settlements(UUID) IS
'Returns all settlements for the car that the given user has access to (either as owner or member). Bypasses RLS.';
