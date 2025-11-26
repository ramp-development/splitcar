-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cars table
CREATE TABLE cars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  currency TEXT DEFAULT 'CAD',
  distance_unit TEXT DEFAULT 'km',
  fuel_unit TEXT DEFAULT 'litre',
  efficiency_km_per_litre NUMERIC NOT NULL,
  avg_price_per_litre NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_guest BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fuel fills table
CREATE TABLE fuel_fills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE NOT NULL,
  payer_member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trips table
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE NOT NULL,
  distance_km NUMERIC NOT NULL CHECK (distance_km >= 0),
  passenger_member_ids UUID[] NOT NULL,
  driver_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settlements table
CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE NOT NULL,
  from_member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  to_member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT different_members CHECK (from_member_id != to_member_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_cars_owner_id ON cars(owner_id);
CREATE INDEX idx_members_car_id ON members(car_id);
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_fuel_fills_car_id ON fuel_fills(car_id);
CREATE INDEX idx_fuel_fills_payer_member_id ON fuel_fills(payer_member_id);
CREATE INDEX idx_trips_car_id ON trips(car_id);
CREATE INDEX idx_settlements_car_id ON settlements(car_id);
CREATE INDEX idx_settlements_from_member_id ON settlements(from_member_id);
CREATE INDEX idx_settlements_to_member_id ON settlements(to_member_id);
