# SplitDrive MVP Plan

## Project Status

-  Next.js 16 project initialized with App Router
-  Tailwind CSS v4 configured
-  shadcn/ui components installed (New York style)
-  Custom hooks library added
- � Supabase integration pending
- � Authentication not implemented
- � Database schema not created
- � Application features not implemented

## Overview

Build a minimal, functional MVP of SplitDrive: a shared-car cost tracking app used by small groups on trips. The goal is to log fuel fills, track trip distances, calculate fair cost splits, and show who owes what.

## Tech Stack

-  Next.js 16 (App Router, React 19.2)
- � Supabase (database + phone number auth)
-  Tailwind CSS v4 + shadcn/ui

## Database Schema

### Users Table

```sql
users (
  id uuid primary key,
  phone text unique not null,
  name text,
  created_at timestamp default now()
)
```

### Cars Table

```sql
cars (
  id uuid primary key,
  owner_id uuid references users(id),
  name text not null,
  currency text default 'CAD',
  distance_unit text default 'km',
  fuel_unit text default 'litre',
  efficiency_km_per_litre numeric not null,
  avg_price_per_litre numeric not null,
  created_at timestamp default now()
)
```

**Derived**: `costPerKm = avg_price_per_litre / efficiency_km_per_litre`

### Members Table

```sql
members (
  id uuid primary key,
  car_id uuid references cars(id) on delete cascade,
  name text not null,
  phone text,
  user_id uuid references users(id),
  is_guest boolean default false,
  created_at timestamp default now()
)
```

### Fuel Fills Table

```sql
fuel_fills (
  id uuid primary key,
  car_id uuid references cars(id) on delete cascade,
  payer_member_id uuid references members(id),
  amount numeric not null,
  created_at timestamp default now()
)
```

### Trips Table

```sql
trips (
  id uuid primary key,
  car_id uuid references cars(id) on delete cascade,
  distance_km numeric not null,
  passenger_member_ids uuid[] not null,
  driver_member_id uuid references members(id),
  created_at timestamp default now()
)
```

**Derived**: `tripCost = distance_km * costPerKm`, split equally across passengers

### Settlements Table

```sql
settlements (
  id uuid primary key,
  car_id uuid references cars(id) on delete cascade,
  from_member_id uuid references members(id),
  to_member_id uuid references members(id),
  amount numeric not null,
  created_at timestamp default now()
)
```

## Balance Calculation Logic

For each member:

```
netBalance = fuelPaid - tripUsage + settlementsReceived - settlementsSent

Where:
- fuelPaid = sum of fuel fills where payer_member_id = member
- tripUsage = sum of (tripCost / passengers.length) for trips member participated in
- settlementsReceived = sum of settlements where to_member_id = member
- settlementsSent = sum of settlements where from_member_id = member
```

**Positive balance** = member is owed money
**Negative balance** = member owes money

## Application Pages

### Authentication Flow

- [x] `/login` - Phone number input
- [x] `/verify` - OTP verification via Supabase Auth
- [x] `/onboarding` - Collect user name (first-time only)

### Main Application

- [x] `/dashboard` - Overview with car setup dialog and navigation
- [x] `/members` - List members, add new members
- [ ] `/fuel` - List fuel fills, add new fill
- [ ] `/trips` - List trips, add new trip
- [ ] `/balances` - Show member balances, settlement actions
- [ ] `/settlements` - List settlements, add new settlement

## Implementation Phases

### Phase 1: Supabase Setup ✅

- [x] Create Supabase project
- [x] Install `@supabase/supabase-js` and `@supabase/ssr`
- [x] Configure environment variables
- [x] Create database tables with RLS policies
- [x] Set up phone auth provider
- [x] Create Supabase client utilities
- [x] Implement auth proxy middleware

### Phase 2: Authentication ✅

- [x] Build login/OTP flow UI
- [x] Create auth context/hooks
- [x] Build phone input page
- [x] Build OTP verification page
- [x] Add AuthProvider and Toaster to layout
- [x] Create dashboard placeholder
- [x] Build onboarding page for name collection

### Phase 3: Car & Members ✅

- [x] Car setup form and creation (as dialog on dashboard)
- [x] Members list and add functionality
- [x] Fixed RLS policies to prevent infinite recursion
- [x] Refactored car form into reusable component

### Phase 4: Fuel & Trips

- [ ] Fuel fills list and form
- [ ] Trips list and form with passenger selection
- [ ] Calculate and display trip costs

### Phase 5: Balances & Settlements

- [ ] Calculate member balances
- [ ] Display balance summary
- [ ] Settlement recording form
- [ ] Settlement history

## MVP Constraints

- One car per user
- Simple equal splits (no weighted splits)
- Frontend-calculated balances (no complex DB queries)
- Minimal styling (use shadcn/ui components)
- No expense editing/deletion initially
- No multi-currency support
