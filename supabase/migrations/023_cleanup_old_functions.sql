-- Clean up old function signatures that use UUID instead of text
-- This fixes the overloading errors in the generated types

DROP FUNCTION IF EXISTS get_user_car(uuid);
DROP FUNCTION IF EXISTS get_car_members(uuid);
DROP FUNCTION IF EXISTS get_car_fuel_fills(uuid);
DROP FUNCTION IF EXISTS get_car_trips(uuid);
DROP FUNCTION IF EXISTS get_car_settlements(uuid);
DROP FUNCTION IF EXISTS auto_link_member_by_phone(text, uuid);
