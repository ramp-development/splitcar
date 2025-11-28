-- Create a function that allows users to get their car details
-- This bypasses RLS and solves potential infinite recursion issues

CREATE OR REPLACE FUNCTION public.get_user_car(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  owner_id UUID,
  name TEXT,
  currency TEXT,
  distance_unit TEXT,
  fuel_unit TEXT,
  efficiency_km_per_litre NUMERIC,
  avg_price_per_litre NUMERIC,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_car_id UUID;
BEGIN
  -- First, check if user owns a car
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

  -- If they have access to a car, return its details
  IF v_car_id IS NOT NULL THEN
    RETURN QUERY
    SELECT
      c.id,
      c.owner_id,
      c.name,
      c.currency,
      c.distance_unit,
      c.fuel_unit,
      c.efficiency_km_per_litre,
      c.avg_price_per_litre,
      c.created_at
    FROM cars c
    WHERE c.id = v_car_id;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_car(UUID) TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION public.get_user_car(UUID) IS
'Returns the car details for the car that the given user has access to (either as owner or member). Bypasses RLS to avoid infinite recursion.';
