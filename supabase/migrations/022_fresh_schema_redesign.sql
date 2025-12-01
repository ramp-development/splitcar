-- Fresh schema redesign for SplitCar with Clerk auth
-- This migration creates a clean, improved database structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (minimal - just for Clerk integration)
CREATE TABLE users (
  id text PRIMARY KEY,
  name text,
  created_at timestamp with time zone DEFAULT now()
);

-- Cars table
CREATE TABLE cars (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  currency text DEFAULT 'CAD',
  distance_unit text DEFAULT 'km',      -- display preference only
  fuel_unit text DEFAULT 'L',           -- display preference only
  km_per_litre numeric(10,2),           -- always stored in metric
  default_price_per_litre numeric(10,2), -- default for fuel expenses
  created_at timestamp with time zone DEFAULT now()
);

-- Member roles enum
CREATE TYPE member_role AS ENUM ('owner', 'guest');

-- Members table (user-car relationship)
CREATE TABLE members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_id uuid NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  user_id text REFERENCES users(id) ON DELETE SET NULL,
  role member_role NOT NULL DEFAULT 'owner',
  is_admin boolean DEFAULT false,
  invite_code text UNIQUE NOT NULL,
  invited_at timestamp with time zone DEFAULT now(),
  joined_at timestamp with time zone,
  archived boolean DEFAULT false,
  archived_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),

  -- Constraints
  CONSTRAINT admin_must_be_owner CHECK (is_admin = false OR role = 'owner')
);

-- Partial unique index to enforce one admin per car
CREATE UNIQUE INDEX idx_one_admin_per_car ON members(car_id) WHERE is_admin = true;

-- Expenses table (replaces fuel_fills, supports all expense types)
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_id uuid NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  payer_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  type text NOT NULL,
  amount numeric(10,2) NOT NULL,
  description text,
  split_with uuid[],  -- member_ids to split with (nullable for fuel)
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now()
);

-- Trips table
CREATE TABLE trips (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_id uuid NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  name text,
  distance numeric(10,2) NOT NULL,
  passengers uuid[] NOT NULL,  -- member_ids
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now()
);

-- Settlement status enum
CREATE TYPE settlement_status AS ENUM ('pending', 'settled');

-- Settlements table
CREATE TABLE settlements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_id uuid NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  from_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  to_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  status settlement_status DEFAULT 'pending',
  settled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),

  -- Prevent settling with yourself
  CONSTRAINT no_self_settlement CHECK (from_id != to_id)
);

-- Indexes for performance
CREATE INDEX idx_members_car_id ON members(car_id);
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_invite_code ON members(invite_code);
CREATE INDEX idx_expenses_car_id ON expenses(car_id);
CREATE INDEX idx_expenses_payer_id ON expenses(payer_id);
CREATE INDEX idx_expenses_date ON expenses(date DESC);
CREATE INDEX idx_trips_car_id ON trips(car_id);
CREATE INDEX idx_trips_date ON trips(date DESC);
CREATE INDEX idx_settlements_car_id ON settlements(car_id);
CREATE INDEX idx_settlements_status ON settlements(status);

-- Helper function: Generate unique invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code (uppercase)
    code := upper(substring(md5(random()::text) from 1 for 8));

    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM members WHERE invite_code = code) INTO code_exists;

    EXIT WHEN NOT code_exists;
  END LOOP;

  RETURN code;
END;
$$;

-- Trigger: Auto-generate invite code if not provided
CREATE OR REPLACE FUNCTION set_invite_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.invite_code IS NULL OR NEW.invite_code = '' THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_invite_code
  BEFORE INSERT ON members
  FOR EACH ROW
  EXECUTE FUNCTION set_invite_code();

-- Trigger: Set archived_at when archived
CREATE OR REPLACE FUNCTION set_archived_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.archived = true AND OLD.archived = false THEN
    NEW.archived_at := now();
  ELSIF NEW.archived = false THEN
    NEW.archived_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER handle_archived_at
  BEFORE UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION set_archived_at();

-- SECURITY DEFINER functions for queries (bypasses RLS when we implement it)

-- Get user's car (as admin or member)
CREATE OR REPLACE FUNCTION get_user_car(p_user_id text)
RETURNS TABLE (
  id uuid,
  name text,
  currency text,
  distance_unit text,
  fuel_unit text,
  km_per_litre numeric,
  default_price_per_litre numeric,
  created_at timestamp with time zone
)
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT DISTINCT c.*
  FROM cars c
  INNER JOIN members m ON m.car_id = c.id
  WHERE m.user_id = p_user_id
    AND m.archived = false
  LIMIT 1;
$$;

-- Get car members
CREATE OR REPLACE FUNCTION get_car_members(p_user_id text)
RETURNS TABLE (
  id uuid,
  car_id uuid,
  user_id text,
  role member_role,
  is_admin boolean,
  invite_code text,
  invited_at timestamp with time zone,
  joined_at timestamp with time zone,
  archived boolean,
  name text
)
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT
    m.id,
    m.car_id,
    m.user_id,
    m.role,
    m.is_admin,
    m.invite_code,
    m.invited_at,
    m.joined_at,
    m.archived,
    u.name
  FROM members m
  LEFT JOIN users u ON u.id = m.user_id
  WHERE m.car_id = (
    SELECT car_id FROM members WHERE user_id = p_user_id AND archived = false LIMIT 1
  )
  ORDER BY
    m.is_admin DESC,
    CASE m.role
      WHEN 'owner' THEN 1
      WHEN 'guest' THEN 2
    END,
    m.joined_at ASC;
$$;

-- Get car expenses
CREATE OR REPLACE FUNCTION get_car_expenses(p_user_id text)
RETURNS TABLE (
  id uuid,
  car_id uuid,
  payer_id uuid,
  type text,
  amount numeric,
  description text,
  split_with uuid[],
  date date,
  created_at timestamp with time zone,
  payer_name text
)
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT
    e.id,
    e.car_id,
    e.payer_id,
    e.type,
    e.amount,
    e.description,
    e.split_with,
    e.date,
    e.created_at,
    u.name as payer_name
  FROM expenses e
  INNER JOIN members m ON m.id = e.payer_id
  LEFT JOIN users u ON u.id = m.user_id
  WHERE e.car_id = (
    SELECT car_id FROM members WHERE user_id = p_user_id AND archived = false LIMIT 1
  )
  ORDER BY e.date DESC, e.created_at DESC;
$$;

-- Get car trips
CREATE OR REPLACE FUNCTION get_car_trips(p_user_id text)
RETURNS TABLE (
  id uuid,
  car_id uuid,
  name text,
  distance numeric,
  passengers uuid[],
  date date,
  created_at timestamp with time zone
)
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT t.*
  FROM trips t
  WHERE t.car_id = (
    SELECT car_id FROM members WHERE user_id = p_user_id AND archived = false LIMIT 1
  )
  ORDER BY t.date DESC, t.created_at DESC;
$$;

-- Get car settlements
CREATE OR REPLACE FUNCTION get_car_settlements(p_user_id text)
RETURNS TABLE (
  id uuid,
  car_id uuid,
  from_id uuid,
  to_id uuid,
  amount numeric,
  status settlement_status,
  settled_at timestamp with time zone,
  created_at timestamp with time zone,
  from_name text,
  to_name text
)
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT
    s.id,
    s.car_id,
    s.from_id,
    s.to_id,
    s.amount,
    s.status,
    s.settled_at,
    s.created_at,
    u1.name as from_name,
    u2.name as to_name
  FROM settlements s
  INNER JOIN members m1 ON m1.id = s.from_id
  LEFT JOIN users u1 ON u1.id = m1.user_id
  INNER JOIN members m2 ON m2.id = s.to_id
  LEFT JOIN users u2 ON u2.id = m2.user_id
  WHERE s.car_id = (
    SELECT car_id FROM members WHERE user_id = p_user_id AND archived = false LIMIT 1
  )
  ORDER BY s.created_at DESC;
$$;

-- Accept invite and link member to user
CREATE OR REPLACE FUNCTION accept_invite(
  p_invite_code text,
  p_user_id text
)
RETURNS uuid
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_member_id uuid;
BEGIN
  -- Update member with user_id and set joined_at
  UPDATE members
  SET
    user_id = p_user_id,
    joined_at = now()
  WHERE invite_code = p_invite_code
    AND user_id IS NULL  -- Only accept if not already linked
  RETURNING id INTO v_member_id;

  RETURN v_member_id;
END;
$$;

COMMENT ON TABLE users IS 'Minimal user table for Clerk authentication';
COMMENT ON TABLE cars IS 'Car configuration and settings';
COMMENT ON TABLE members IS 'User-car relationships with roles and invites';
COMMENT ON TABLE expenses IS 'All expenses including fuel, insurance, services, etc.';
COMMENT ON TABLE trips IS 'Trip records for calculating mileage-based costs';
COMMENT ON TABLE settlements IS 'Payment settlements between members';
