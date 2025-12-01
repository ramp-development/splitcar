-- Temporarily disable RLS for Phase 2 refactoring (Clerk migration + invite system)
-- We will re-implement RLS from scratch with the new auth system and schema
--
-- Rationale:
-- 1. Current RLS is complex (migrations 008-019 show multiple attempts/fixes)
-- 2. Auth system changing (Supabase UUID -> Clerk text IDs)
-- 3. Schema changing (adding invite_code to members, simplifying users table)
-- 4. Better to design RLS once with final structure than patch existing policies
--
-- SECURITY NOTE: This is safe for development/refactoring but should NOT go to production
-- until new RLS policies are in place. Keep SECURITY DEFINER functions - they're still useful.

-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE cars DISABLE ROW LEVEL SECURITY;
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_fills DISABLE ROW LEVEL SECURITY;
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE settlements DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies (clean slate for future RLS implementation)
-- Users table
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_insert_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;

-- Cars table
DROP POLICY IF EXISTS cars_select_owner ON cars;
DROP POLICY IF EXISTS cars_insert_owner ON cars;
DROP POLICY IF EXISTS cars_update_owner ON cars;
DROP POLICY IF EXISTS cars_delete_owner ON cars;
DROP POLICY IF EXISTS cars_select_member ON cars;

-- Members table
DROP POLICY IF EXISTS members_select_car ON members;
DROP POLICY IF EXISTS members_insert_car ON members;
DROP POLICY IF EXISTS members_update_car ON members;
DROP POLICY IF EXISTS members_delete_car ON members;
DROP POLICY IF EXISTS members_select_own ON members;
DROP POLICY IF EXISTS members_update_own ON members;
DROP POLICY IF EXISTS members_self_link ON members;
DROP POLICY IF EXISTS members_select_owner_or_self ON members;

-- Fuel fills table
DROP POLICY IF EXISTS fuel_fills_select_car ON fuel_fills;
DROP POLICY IF EXISTS fuel_fills_insert_car ON fuel_fills;
DROP POLICY IF EXISTS fuel_fills_update_car ON fuel_fills;
DROP POLICY IF EXISTS fuel_fills_delete_car ON fuel_fills;

-- Trips table
DROP POLICY IF EXISTS trips_select_car ON trips;
DROP POLICY IF EXISTS trips_insert_car ON trips;
DROP POLICY IF EXISTS trips_update_car ON trips;
DROP POLICY IF EXISTS trips_delete_car ON trips;

-- Settlements table
DROP POLICY IF EXISTS settlements_select_car ON settlements;
DROP POLICY IF EXISTS settlements_insert_car ON settlements;
DROP POLICY IF EXISTS settlements_update_car ON settlements;
DROP POLICY IF EXISTS settlements_delete_car ON settlements;

-- Note: We're keeping all SECURITY DEFINER functions as they're useful:
-- - auto_link_member_by_phone
-- - get_car_members
-- - get_user_car
-- - get_car_fuel_fills
-- - get_car_trips
-- - get_car_settlements
--
-- These functions will be updated for Clerk auth in a future migration.
