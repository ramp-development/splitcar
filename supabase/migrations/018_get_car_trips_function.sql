-- Create a function that allows users to get trips for their car
-- This bypasses RLS and solves permission issues

-- Drop the old function first to allow changing the return type
DROP FUNCTION IF EXISTS public.get_car_trips(UUID);

CREATE OR REPLACE FUNCTION public.get_car_trips(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  car_id UUID,
  name TEXT,
  distance_km NUMERIC,
  passenger_member_ids UUID[],
  date DATE,
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

  -- If they have access to a car, return all trips
  IF v_car_id IS NOT NULL THEN
    RETURN QUERY
    SELECT
      t.id,
      t.car_id,
      t.name,
      t.distance_km,
      t.passenger_member_ids,
      t.date,
      t.created_at
    FROM trips t
    WHERE t.car_id = v_car_id
    ORDER BY t.date DESC, t.created_at DESC;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_car_trips(UUID) TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION public.get_car_trips(UUID) IS
'Returns all trips for the car that the given user has access to (either as owner or member). Bypasses RLS.';
