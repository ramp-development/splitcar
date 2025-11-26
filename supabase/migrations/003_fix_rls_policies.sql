-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can read own cars and cars they're members of" ON cars;
DROP POLICY IF EXISTS "Users can read members of accessible cars" ON members;
DROP POLICY IF EXISTS "Users can read fuel fills of accessible cars" ON fuel_fills;
DROP POLICY IF EXISTS "Users can insert fuel fills for accessible cars" ON fuel_fills;
DROP POLICY IF EXISTS "Users can read trips of accessible cars" ON trips;
DROP POLICY IF EXISTS "Users can insert trips for accessible cars" ON trips;
DROP POLICY IF EXISTS "Users can read settlements of accessible cars" ON settlements;
DROP POLICY IF EXISTS "Users can insert settlements for accessible cars" ON settlements;

-- Simplified Cars policies (owner only for MVP)
CREATE POLICY "Users can read own cars"
  ON cars FOR SELECT
  USING (auth.uid() = owner_id);

-- Simplified Members policies (owner only for MVP)
CREATE POLICY "Users can read members of own cars"
  ON members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = members.car_id
      AND cars.owner_id = auth.uid()
    )
  );

-- Simplified Fuel fills policies (owner only for MVP)
CREATE POLICY "Users can read fuel fills of own cars"
  ON fuel_fills FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = fuel_fills.car_id
      AND cars.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert fuel fills for own cars"
  ON fuel_fills FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = fuel_fills.car_id
      AND cars.owner_id = auth.uid()
    )
  );

-- Simplified Trips policies (owner only for MVP)
CREATE POLICY "Users can read trips of own cars"
  ON trips FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = trips.car_id
      AND cars.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert trips for own cars"
  ON trips FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = trips.car_id
      AND cars.owner_id = auth.uid()
    )
  );

-- Simplified Settlements policies (owner only for MVP)
CREATE POLICY "Users can read settlements of own cars"
  ON settlements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = settlements.car_id
      AND cars.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert settlements for own cars"
  ON settlements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = settlements.car_id
      AND cars.owner_id = auth.uid()
    )
  );
