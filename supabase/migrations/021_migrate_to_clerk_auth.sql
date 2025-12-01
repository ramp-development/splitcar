-- Migrate users table from Supabase auth (UUID) to Clerk (text IDs)
--
-- This migration:
-- 1. Changes users.id from uuid to text (Clerk IDs like user_2abc123)
-- 2. Updates members.user_id to text to match
-- 3. Updates cars.owner_id to text to match
-- 4. Keeps all existing data (we'll migrate user IDs manually or via script)

-- Step 0: Drop ALL policies that might reference the columns we're changing
-- This is necessary because we can't alter column types if policies reference them
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop all policies on users table
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'users' LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON users';
  END LOOP;

  -- Drop all policies on cars table
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'cars' LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON cars';
  END LOOP;

  -- Drop all policies on members table
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'members' LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON members';
  END LOOP;

  -- Drop all policies on fuel_fills table
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'fuel_fills' LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON fuel_fills';
  END LOOP;

  -- Drop all policies on trips table
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'trips' LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON trips';
  END LOOP;

  -- Drop all policies on settlements table
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'settlements' LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON settlements';
  END LOOP;
END $$;

-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE cars DISABLE ROW LEVEL SECURITY;
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_fills DISABLE ROW LEVEL SECURITY;
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE settlements DISABLE ROW LEVEL SECURITY;

-- Step 1: Drop foreign key constraints that reference users.id
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_user_id_fkey;
ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_owner_id_fkey;

-- Step 2: Change users table primary key type
-- Database has been cleared, so we can simply drop and recreate
DROP TABLE users CASCADE;

CREATE TABLE users (
  id text PRIMARY KEY,              -- Clerk user ID (e.g., user_2abc123)
  created_at timestamp with time zone DEFAULT now()
);

-- Step 3: Update members.user_id to text
ALTER TABLE members ALTER COLUMN user_id TYPE text USING user_id::text;

-- Step 4: Update cars.owner_id to text
ALTER TABLE cars ALTER COLUMN owner_id TYPE text USING owner_id::text;

-- Step 5: Re-create foreign key constraints
ALTER TABLE members
  ADD CONSTRAINT members_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE SET NULL;

ALTER TABLE cars
  ADD CONSTRAINT cars_owner_id_fkey
  FOREIGN KEY (owner_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

-- Step 6: Update database functions to use text instead of uuid
-- These functions currently accept p_user_id as uuid, need to change to text

-- Drop and recreate get_user_car function
DROP FUNCTION IF EXISTS get_user_car(uuid);

CREATE OR REPLACE FUNCTION get_user_car(p_user_id text)
RETURNS TABLE (
  id uuid,
  owner_id text,
  name text,
  currency text,
  distance_unit text,
  fuel_unit text,
  efficiency_km_per_litre numeric,
  avg_price_per_litre numeric,
  created_at timestamp with time zone
)
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT c.* FROM cars c
  WHERE c.owner_id = p_user_id
  UNION
  SELECT c.* FROM cars c
  INNER JOIN members m ON m.car_id = c.id
  WHERE m.user_id = p_user_id
  LIMIT 1;
$$;

-- Drop and recreate get_car_members function
DROP FUNCTION IF EXISTS get_car_members(uuid);

CREATE OR REPLACE FUNCTION get_car_members(p_user_id text)
RETURNS TABLE (
  id uuid,
  car_id uuid,
  name text,
  phone text,
  user_id text,
  is_guest boolean,
  archived boolean,
  created_at timestamp with time zone
)
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT m.* FROM members m
  INNER JOIN cars c ON c.id = m.car_id
  WHERE c.owner_id = p_user_id
     OR EXISTS (
       SELECT 1 FROM members mem
       WHERE mem.car_id = c.id AND mem.user_id = p_user_id
     );
$$;

-- Drop and recreate get_car_fuel_fills function
DROP FUNCTION IF EXISTS get_car_fuel_fills(uuid);

CREATE OR REPLACE FUNCTION get_car_fuel_fills(p_user_id text)
RETURNS TABLE (
  id uuid,
  car_id uuid,
  payer_member_id uuid,
  amount numeric,
  date date,
  created_at timestamp with time zone,
  payer_name text
)
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT
    f.id,
    f.car_id,
    f.payer_member_id,
    f.amount,
    f.date,
    f.created_at,
    m.name as payer_name
  FROM fuel_fills f
  INNER JOIN members m ON m.id = f.payer_member_id
  INNER JOIN cars c ON c.id = f.car_id
  WHERE c.owner_id = p_user_id
     OR EXISTS (
       SELECT 1 FROM members mem
       WHERE mem.car_id = c.id AND mem.user_id = p_user_id
     )
  ORDER BY f.date DESC, f.created_at DESC;
$$;

-- Drop and recreate get_car_trips function
DROP FUNCTION IF EXISTS get_car_trips(uuid);

CREATE OR REPLACE FUNCTION get_car_trips(p_user_id text)
RETURNS TABLE (
  id uuid,
  car_id uuid,
  name text,
  distance_km numeric,
  passenger_member_ids uuid[],
  date date,
  created_at timestamp with time zone
)
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT t.* FROM trips t
  INNER JOIN cars c ON c.id = t.car_id
  WHERE c.owner_id = p_user_id
     OR EXISTS (
       SELECT 1 FROM members m
       WHERE m.car_id = c.id AND m.user_id = p_user_id
     )
  ORDER BY t.date DESC, t.created_at DESC;
$$;

-- Drop and recreate get_car_settlements function
DROP FUNCTION IF EXISTS get_car_settlements(uuid);

CREATE OR REPLACE FUNCTION get_car_settlements(p_user_id text)
RETURNS TABLE (
  id uuid,
  car_id uuid,
  from_member_id uuid,
  to_member_id uuid,
  amount numeric,
  created_at timestamp with time zone,
  from_member_name text,
  to_member_name text
)
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT
    s.id,
    s.car_id,
    s.from_member_id,
    s.to_member_id,
    s.amount,
    s.created_at,
    m1.name as from_member_name,
    m2.name as to_member_name
  FROM settlements s
  INNER JOIN members m1 ON m1.id = s.from_member_id
  INNER JOIN members m2 ON m2.id = s.to_member_id
  INNER JOIN cars c ON c.id = s.car_id
  WHERE c.owner_id = p_user_id
     OR EXISTS (
       SELECT 1 FROM members m
       WHERE m.car_id = c.id AND m.user_id = p_user_id
     )
  ORDER BY s.created_at DESC;
$$;

-- Drop and recreate auto_link_member_by_phone function
DROP FUNCTION IF EXISTS auto_link_member_by_phone(text, uuid);

CREATE OR REPLACE FUNCTION auto_link_member_by_phone(
  p_phone text,
  p_user_id text
)
RETURNS boolean
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated_count integer;
BEGIN
  -- Update all members with matching phone number to link to this user
  UPDATE members
  SET user_id = p_user_id,
      joined_at = now()
  WHERE phone = p_phone
    AND user_id IS NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN v_updated_count > 0;
END;
$$;

-- Add comment explaining the migration
COMMENT ON TABLE users IS 'Users table migrated to Clerk auth (text IDs instead of UUID)';
