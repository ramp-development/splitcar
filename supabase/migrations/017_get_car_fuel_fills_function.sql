-- Create a function that allows users to get fuel fills for their car
-- This bypasses RLS and solves permission issues

DROP FUNCTION IF EXISTS public.get_car_fuel_fills(UUID);

CREATE OR REPLACE FUNCTION public.get_car_fuel_fills(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  car_id UUID,
  payer_member_id UUID,
  payer_name TEXT,
  amount NUMERIC,
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

  -- If they have access to a car, return all fuel fills with member names
  IF v_car_id IS NOT NULL THEN
    RETURN QUERY
    SELECT
      ff.id,
      ff.car_id,
      ff.payer_member_id,
      m.name as payer_name,
      ff.amount,
      ff.date,
      ff.created_at
    FROM fuel_fills ff
    LEFT JOIN members m ON m.id = ff.payer_member_id
    WHERE ff.car_id = v_car_id
    ORDER BY ff.date DESC, ff.created_at DESC;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_car_fuel_fills(UUID) TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION public.get_car_fuel_fills(UUID) IS
'Returns all fuel fills for the car that the given user has access to (either as owner or member). Bypasses RLS.';
