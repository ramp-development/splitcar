-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_fills ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- Users policies
-- Users can read their own record
CREATE POLICY "Users can read own record"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own record
CREATE POLICY "Users can update own record"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own record (for signup)
CREATE POLICY "Users can insert own record"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Cars policies
-- Users can read cars they own or are members of
CREATE POLICY "Users can read own cars and cars they're members of"
  ON cars FOR SELECT
  USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM members
      WHERE members.car_id = cars.id
      AND members.user_id = auth.uid()
    )
  );

-- Users can insert their own cars
CREATE POLICY "Users can insert own cars"
  ON cars FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Users can update their own cars
CREATE POLICY "Users can update own cars"
  ON cars FOR UPDATE
  USING (auth.uid() = owner_id);

-- Users can delete their own cars
CREATE POLICY "Users can delete own cars"
  ON cars FOR DELETE
  USING (auth.uid() = owner_id);

-- Members policies
-- Users can read members of cars they have access to
CREATE POLICY "Users can read members of accessible cars"
  ON members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = members.car_id
      AND (
        cars.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM members m
          WHERE m.car_id = cars.id
          AND m.user_id = auth.uid()
        )
      )
    )
  );

-- Car owners can insert members
CREATE POLICY "Car owners can insert members"
  ON members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = members.car_id
      AND cars.owner_id = auth.uid()
    )
  );

-- Car owners can update members
CREATE POLICY "Car owners can update members"
  ON members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = members.car_id
      AND cars.owner_id = auth.uid()
    )
  );

-- Car owners can delete members
CREATE POLICY "Car owners can delete members"
  ON members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = members.car_id
      AND cars.owner_id = auth.uid()
    )
  );

-- Fuel fills policies
-- Users can read fuel fills for cars they have access to
CREATE POLICY "Users can read fuel fills of accessible cars"
  ON fuel_fills FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = fuel_fills.car_id
      AND (
        cars.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM members
          WHERE members.car_id = cars.id
          AND members.user_id = auth.uid()
        )
      )
    )
  );

-- Users can insert fuel fills for cars they have access to
CREATE POLICY "Users can insert fuel fills for accessible cars"
  ON fuel_fills FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = fuel_fills.car_id
      AND (
        cars.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM members
          WHERE members.car_id = cars.id
          AND members.user_id = auth.uid()
        )
      )
    )
  );

-- Car owners can update fuel fills
CREATE POLICY "Car owners can update fuel fills"
  ON fuel_fills FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = fuel_fills.car_id
      AND cars.owner_id = auth.uid()
    )
  );

-- Car owners can delete fuel fills
CREATE POLICY "Car owners can delete fuel fills"
  ON fuel_fills FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = fuel_fills.car_id
      AND cars.owner_id = auth.uid()
    )
  );

-- Trips policies
-- Users can read trips for cars they have access to
CREATE POLICY "Users can read trips of accessible cars"
  ON trips FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = trips.car_id
      AND (
        cars.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM members
          WHERE members.car_id = cars.id
          AND members.user_id = auth.uid()
        )
      )
    )
  );

-- Users can insert trips for cars they have access to
CREATE POLICY "Users can insert trips for accessible cars"
  ON trips FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = trips.car_id
      AND (
        cars.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM members
          WHERE members.car_id = cars.id
          AND members.user_id = auth.uid()
        )
      )
    )
  );

-- Car owners can update trips
CREATE POLICY "Car owners can update trips"
  ON trips FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = trips.car_id
      AND cars.owner_id = auth.uid()
    )
  );

-- Car owners can delete trips
CREATE POLICY "Car owners can delete trips"
  ON trips FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = trips.car_id
      AND cars.owner_id = auth.uid()
    )
  );

-- Settlements policies
-- Users can read settlements for cars they have access to
CREATE POLICY "Users can read settlements of accessible cars"
  ON settlements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = settlements.car_id
      AND (
        cars.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM members
          WHERE members.car_id = cars.id
          AND members.user_id = auth.uid()
        )
      )
    )
  );

-- Users can insert settlements for cars they have access to
CREATE POLICY "Users can insert settlements for accessible cars"
  ON settlements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = settlements.car_id
      AND (
        cars.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM members
          WHERE members.car_id = cars.id
          AND members.user_id = auth.uid()
        )
      )
    )
  );

-- Car owners can update settlements
CREATE POLICY "Car owners can update settlements"
  ON settlements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = settlements.car_id
      AND cars.owner_id = auth.uid()
    )
  );

-- Car owners can delete settlements
CREATE POLICY "Car owners can delete settlements"
  ON settlements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM cars
      WHERE cars.id = settlements.car_id
      AND cars.owner_id = auth.uid()
    )
  );
