# SplitCar MVP Plan

## Project Status

- ✅ Next.js 16 project initialized with App Router
- ✅ Tailwind CSS v4 configured
- ✅ shadcn/ui components installed (New York style)
- ✅ Custom hooks library added
- ✅ Supabase integration complete
- ✅ Authentication implemented with phone OTP
- ✅ Database schema created with RLS policies
- ✅ Navigation & layout components built
- ✅ Reusable DataTable component created
- ✅ Members page with archive functionality complete
- ✅ Fuel fills feature complete
- ✅ Trips feature complete
- ✅ Balances & Settlements complete
- ✅ Production build successful
- ✅ Deployed to Vercel
- ✅ Member invites with auto-linking
- ✅ Multi-user access (owners + members)
- ✅ **MVP COMPLETE & LIVE!**

## Overview

Build a minimal, functional MVP of SplitCar: a shared-car cost tracking app used by small groups on trips. The goal is to log fuel fills, track trip distances, calculate fair cost splits, and show who owes what.

## Tech Stack

- ✅ Next.js 16 (App Router, React 19.2)
- ✅ Supabase (database + phone number auth)
- ✅ Tailwind CSS v4 + shadcn/ui
- ✅ @tanstack/react-table for data tables

## Design Guidelines

### Layout & Spacing

- **Container**: All app pages use `(app)/layout.tsx` which provides navbar, breadcrumbs, and max-width container
- **No nested cards**: Avoid cards within cards - use simple headings and content directly
- **Mobile-first**: Stack elements vertically on mobile, side-by-side on desktop using `flex-col sm:flex-row`

### Component Patterns

- **DataTable**: Use the reusable `components/ui/data-table.tsx` for all list pages
  - Supports filtering, sorting, and custom toolbar actions
  - Mobile-responsive with horizontal scroll
  - Column definitions in separate files (e.g., `components/members/columns.tsx`)
- **Forms**: Use Dialog components for add/edit forms
- **Navigation**: Active states handled via `usePathname()` and `data-active` attribute

### Table Styling

- Header cells: `h-12 px-4`
- Body cells: `p-4`
- Use `whitespace-nowrap` for compact tables

### Example Page Structure

```tsx
export default function ExamplePage() {
  return (
    <DataTable
      columns={columns}
      data={data}
      filterColumn="name"
      filterPlaceholder="Filter..."
      toolbarActions={<Button>Add Item</Button>}
    />
  );
}
```

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
  archived boolean default false,
  created_at timestamp default now()
)
```

**Note**: Members cannot be deleted (data integrity). Use `archived` flag instead.

### Fuel Fills Table

```sql
fuel_fills (
  id uuid primary key,
  car_id uuid references cars(id) on delete cascade,
  payer_member_id uuid references members(id),
  amount numeric not null,
  date date not null default current_date,
  created_at timestamp default now()
)
```

### Trips Table

```sql
trips (
  id uuid primary key,
  car_id uuid references cars(id) on delete cascade,
  name text,
  distance_km numeric not null,
  passenger_member_ids uuid[] not null,
  date date not null default current_date,
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

- [x] `/dashboard` - Overview with navigation cards
- [x] `/members` - DataTable with edit/archive functionality
- [x] `/fuel` - List fuel fills, add new fill
- [x] `/trips` - List trips, add new trip with name and passengers
- [x] `/balances` - Show member balances, settlement actions
- [x] `/settlements` - List settlements, add new settlement

## Implementation Phases

### Phase 1: Supabase Setup ✅

- [x] Create Supabase project
- [x] Install `@supabase/supabase-js` and `@supabase/ssr`
- [x] Configure environment variables
- [x] Create database tables with RLS policies (migrations 001-007)
- [x] Set up phone auth provider
- [x] Create Supabase client utilities (client.ts, server.ts, middleware.ts)
- [x] Implement auth proxy middleware (proxy.ts for Next.js 16)

### Phase 2: Authentication ✅

- [x] Build login/OTP flow UI
- [x] Create auth context/hooks (lib/auth/context.tsx)
- [x] Build phone input page with OTP sending
- [x] Build OTP verification page with InputOTP component
- [x] Add AuthProvider and Toaster to root layout
- [x] Build onboarding page for name collection
- [x] Auto-link members with matching phone numbers on login
- [x] Phone number normalization (E.164 format handling)
- [x] Auto-copy member name to user record on linking

### Phase 3: Car & Members ✅

- [x] Car setup form component (components/car/car-setup-form.tsx)
- [x] Car creation dialog on dashboard
- [x] Auto-add owner as member when creating car
- [x] Fixed RLS infinite recursion (migration 003)
- [x] Created reusable DataTable component
- [x] Members page with DataTable
- [x] Add/edit member functionality
- [x] Archive/unarchive members (migration 004)
- [x] "Show archived" toggle (only visible when archived members exist)
- [x] Member type badges (Owner/Guest/Member)
- [x] Member invite system with Web Share API
- [x] Status column (Joined/Pending/No phone)
- [x] Pre-filled phone login via URL parameter

### Phase 4: Navigation & Layout ✅

- [x] Create AppNavbar with responsive design
- [x] Create AppBreadcrumb for contextual navigation
- [x] Implement (app) and (auth) route groups
- [x] Add active state tracking to navigation
- [x] Create landing page with feature cards
- [x] Mobile-responsive navbar (hide links on small screens)

### Phase 5: Fuel & Trips ✅

- [x] Fuel fills DataTable and columns
- [x] Add fuel fill form (payer selection, amount)
- [x] Auto-select current user as payer
- [x] Filter archived members from selection dropdowns
- [x] Trips DataTable and columns
- [x] Add trip form (name, distance, passenger multi-select)
- [x] Auto-select current user as passenger
- [x] Calculate and display trip costs (total and per passenger)
- [x] Add date fields to fuel fills and trips (migrations 006-007)
- [x] Replace date inputs with shadcn Calendar picker
- [x] Prevent future date selection
- [x] Support retrospective entry with dropdown year/month selection

### Phase 6: Balances & Settlements ✅

- [x] Calculate member balances (frontend)
- [x] Display balance summary table
- [x] Settlement recording form
- [x] Settlement history DataTable
- [x] Update balances after new settlements
- [x] Created balances page with complete balance breakdown
- [x] Created settlements page with form and history
- [x] Auto-select current user as settlement sender
- [x] Validate From ≠ To in settlement form
- [x] Color-coded balances (green = owed, red = owes)

### Phase 7: Deployment ✅

- [x] Fixed landing page to use server component (removed "use client")
- [x] Replaced useRouter with Next.js Link components
- [x] Production build successful (pnpm build)
- [x] Deployed to Vercel
- [x] Environment variables configured (Supabase URL + anon key)
- [x] Supabase redirect URLs updated for production

### Phase 8: Multi-User Support ✅

- [x] SECURITY DEFINER functions to bypass RLS (migrations 009-019)
- [x] Member auto-linking on login (migration 009)
- [x] Multi-user car access (owners + members)
- [x] Database functions for all data queries:
  - [x] `get_user_car()` - Get car for owner or member
  - [x] `get_car_members()` - Get all members
  - [x] `get_car_fuel_fills()` - Get fuel fills with payer names
  - [x] `get_car_trips()` - Get trips with dates
  - [x] `get_car_settlements()` - Get settlements with member names
- [x] Updated all pages to support member access
- [x] Consistent member sorting (current user, members, guests)
- [x] Fixed date display in fuel fills and trips tables

## Key Files & Structure

```
app/
├── (auth)/              # Auth route group with centered layout
│   ├── layout.tsx       # Centered auth layout
│   ├── login/
│   ├── verify/
│   └── onboarding/
├── (app)/               # App route group with navbar + breadcrumbs
│   ├── layout.tsx       # Navbar + breadcrumbs + container
│   ├── dashboard/
│   ├── members/
│   ├── fuel/
│   ├── trips/
│   ├── balances/
│   └── settlements/
├── page.tsx             # Landing page (public)
└── layout.tsx           # Root layout with AuthProvider + Toaster

components/
├── ui/                  # shadcn/ui components
│   ├── data-table.tsx   # Reusable table component
│   ├── table.tsx        # Table primitives (updated spacing)
│   └── navigation-menu.tsx  # Updated with active prop
├── app/                 # App-specific components
│   ├── app-navbar.tsx   # Main navigation
│   └── app-breadcrumb.tsx
├── car/
│   └── car-setup-form.tsx
├── members/
│   └── columns.tsx      # Member table column definitions
├── fuel-fills/
│   └── columns.tsx      # Fuel fill table column definitions
├── trips/
│   └── columns.tsx      # Trip table column definitions
├── balances/
│   └── columns.tsx      # Balance table column definitions
└── settlements/
    └── columns.tsx      # Settlement table column definitions

lib/
├── supabase/
│   ├── client.ts        # Browser client
│   ├── server.ts        # Server client
│   └── middleware.ts    # Auth middleware utilities
└── auth/
    └── context.tsx      # Auth context + useAuth hook

supabase/
└── migrations/
    ├── 001_initial_schema.sql
    ├── 002_rls_policies.sql
    ├── 003_fix_rls_policies.sql
    ├── 004_add_archived_to_members.sql
    ├── 005_add_name_to_trips.sql
    ├── 006_add_date_to_fuel_fills.sql
    ├── 007_add_date_to_trips.sql
    ├── 008_member_self_link_policy.sql
    ├── 009_member_auto_link_function.sql
    ├── 010_get_user_car_id_function.sql
    ├── 011_members_rls_for_members.sql
    ├── 012_remove_member_link_policy.sql
    ├── 013_allow_member_inserts_function.sql
    ├── 014_allow_member_data_access.sql
    ├── 015_get_car_members_function.sql
    ├── 016_get_user_car_function.sql
    ├── 017_get_car_fuel_fills_function.sql
    ├── 018_get_car_trips_function.sql
    └── 019_get_car_settlements_function.sql
```

## MVP Constraints

- One car per user/member
- Simple equal splits (no weighted splits)
- Frontend-calculated balances (no complex DB queries)
- Minimal styling (use shadcn/ui components)
- No editing/deletion of expenses (archive instead)
- No multi-currency support
- Members cannot be deleted (use archive)
- ~~Owner-only access (no sharing between users yet)~~ ✅ Multi-user support complete!
