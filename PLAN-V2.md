# SplitCar V2 - Refactoring & Improvements Plan

## Current Status

MVP is complete and deployed. This document outlines the next phase: improving architecture, developer experience, and user onboarding flow.

## Major Improvements

### 1. Authentication Migration: Supabase → Clerk

**Problem:**
- Supabase phone auth requires paid Twilio integration
- Current phone-only flow is limiting
- OTP costs add up for non-commercial project

**Solution: Migrate to Clerk**

Clerk provides:
- Free tier with phone, email, and social auth
- Built-in user management UI
- Better developer experience
- No Twilio setup required
- Multi-factor authentication support

**Implementation Plan:**

1. **Setup & Configuration**
   - Install Clerk SDK: `@clerk/nextjs`
   - Configure environment variables (Clerk publishable/secret keys)
   - Set up Clerk middleware to replace Supabase auth middleware
   - Configure sign-in options (email, phone, Google, etc.)

2. **User Table Migration**
   - Simplify `users` table - Clerk is source of truth for user data
   - Update to use Clerk user IDs instead of Supabase auth IDs
   - Schema changes:
     ```sql
     users (
       id text primary key,          -- Clerk user ID (user_xxx)
       created_at timestamp default now()
     )
     ```
   - That's it! Email, phone, name all stored in Clerk, not duplicated

3. **Auth Context Replacement**
   - Replace `lib/auth/context.tsx` with Clerk's `useUser()` and `useAuth()`
   - Update all components using auth context
   - Remove Supabase auth-specific code

4. **Page Updates**
   - Remove: `(auth)/login`, `(auth)/verify` pages
   - Keep: `(auth)/onboarding` page (for name collection)
   - Use Clerk's `<SignIn />` and `<SignUp />` components
   - Add Clerk's `<UserButton />` to navbar

5. **Database Integration**
   - Update RLS policies to work with Clerk user IDs (text instead of uuid)
   - Keep all existing `get_user_*` functions
   - Member linking uses `user_id` directly (no email/phone matching needed)

6. **Migration Steps**
   - [ ] Install Clerk and configure
   - [ ] Create new auth pages with Clerk components
   - [ ] Update middleware and auth utilities
   - [ ] Migrate user table schema
   - [ ] Update all auth context usage
   - [ ] Update RLS policies
   - [ ] Test authentication flow
   - [ ] Deploy and migrate existing users

**Benefits:**
- Multiple sign-in options (email, phone, social)
- Better UX with Clerk's pre-built components
- No Twilio costs
- Easier to maintain

---

### 2. Improved Invite Flow: One Invite Code Per Member

**Problem:**
- Current flow requires knowing member's phone number
- Phone numbers can be sensitive/private
- Hard to invite someone not in your contacts
- Ambiguity with email/phone matching

**New Solution: 1:1 Member Invite Links**

Each member gets their own unique invite code. Simple, predictable, no ambiguity.

**User Flow:**

1. **Car Owner Adds Member**
   - Add member with just a name (no email/phone required)
   - Member created with `user_id = NULL` (not linked yet)
   - Click "Invite" button → generates unique code for that member
   - Share link: `https://splitcar.app/join/abc123xyz`

2. **Invitee Joins**
   - Click invite link (unauthenticated)
   - Shown: "Greg invited you to join Tesla Model 3"
   - Sign in or sign up with Clerk
   - After auth, `user_id` automatically linked to that member
   - Redirected to car dashboard

**Database Schema Changes:**

```sql
-- Update members table to include invite code
members (
  id uuid primary key,
  car_id uuid references cars(id),
  name text not null,
  user_id text references users(id),      -- NULL until they join
  invite_code text unique,                 -- Generated when owner clicks "Invite"
  invited_at timestamp,                    -- When invite was created
  joined_at timestamp,                     -- When user_id was linked
  is_guest boolean default false,
  archived boolean default false,
  created_at timestamp default now()
);
```

No separate `car_invites` table needed - simpler!

**Implementation:**

1. **Members Page Updates**
   - Add "Invite" button next to each member (only if `user_id IS NULL`)
   - Generates invite code if not exists
   - Copy/share invite link via Web Share API
   - Show status: "Pending" (not joined), "Joined" (has user_id)

2. **Join Page** (`/join/[inviteCode]`)
   - Public route (no auth required)
   - Look up member by invite_code
   - Show car name and inviter info
   - Redirect to Clerk sign-in/sign-up
   - After auth, link Clerk user ID to member

3. **Member Linking Logic**
   - Server action: `linkMemberToUser(inviteCode, clerkUserId)`
   - Validate invite code exists and not already linked
   - Update: `SET user_id = clerkUserId, joined_at = NOW()`
   - Redirect to dashboard

**Benefits:**
- ✅ No ambiguity (one code = one specific member)
- ✅ No email/phone matching issues
- ✅ Simpler schema (no extra tables)
- ✅ Owner can see who hasn't joined yet
- ✅ Can regenerate codes if needed
- ✅ Easy to revoke (archive the member)

**Edge Cases:**
- If member already has `user_id`, don't show "Invite" button
- Can regenerate invite code if user lost it
- Archived members can't be invited (must unarchive first)

---

### 3. Database Type Safety & Organization

**Problem:**
- Types are defined ad-hoc in component files
- No single source of truth for database schema
- Hard to keep types in sync with database
- Risk of type mismatches

**Solution: Centralized Type System**

**Approach: Supabase Type Generation**

Supabase can auto-generate TypeScript types from your database schema.

**Setup:**

```bash
# Install Supabase CLI
npm install --save-dev supabase

# Generate types from database
npx supabase gen types typescript --project-id [PROJECT_ID] > lib/database.types.ts
```

**File Structure:**

```
lib/
├── database.types.ts         # Auto-generated from Supabase
├── types/
│   ├── index.ts              # Re-export all types
│   ├── car.ts                # Car-related types & helpers
│   ├── member.ts             # Member-related types & helpers
│   ├── trip.ts               # Trip-related types & helpers
│   ├── fuel-fill.ts          # Fuel fill types & helpers
│   └── settlement.ts         # Settlement types & helpers
```

**Example `lib/types/car.ts`:**

```typescript
import { Database } from '@/lib/database.types';

// Base types from database
export type Car = Database['public']['Tables']['cars']['Row'];
export type CarInsert = Database['public']['Tables']['cars']['Insert'];
export type CarUpdate = Database['public']['Tables']['cars']['Update'];

// Extended types with computed properties
export type CarWithMetrics = Car & {
  costPerKm: number;
  memberCount: number;
  totalFuelSpend: number;
};

// Helper functions
export function calculateCostPerKm(car: Car): number {
  return car.avg_price_per_litre / car.efficiency_km_per_litre;
}
```

**Benefits:**
- Type safety across entire app
- Auto-complete for database columns
- Catch schema mismatches at compile time
- Single source of truth
- Easy to update when schema changes

**Implementation Steps:**
1. Set up Supabase CLI and type generation script
2. Generate initial types
3. Create type helper files
4. Update all components to use new types
5. Add npm script: `"types:generate": "supabase gen types typescript..."`
6. Document type generation in README

---

### 4. Code Refactoring & Organization

**Problem:**
- Database queries scattered across page components
- Business logic mixed with UI code
- Hard to test and maintain
- Duplicate query patterns

**Solution: Clean Architecture with Separation of Concerns**

**New Structure:**

```
lib/
├── types/                    # Type definitions (as above)
├── queries/                  # Database query functions
│   ├── cars.ts
│   ├── members.ts
│   ├── fuel-fills.ts
│   ├── trips.ts
│   ├── settlements.ts
│   └── balances.ts
├── actions/                  # Server actions for mutations
│   ├── car-actions.ts
│   ├── member-actions.ts
│   ├── fuel-fill-actions.ts
│   ├── trip-actions.ts
│   └── settlement-actions.ts
├── services/                 # Business logic & calculations
│   ├── balance-calculator.ts
│   ├── cost-calculator.ts
│   └── member-sorter.ts
├── utils/                    # Utility functions
│   ├── date-formatter.ts
│   ├── currency-formatter.ts
│   └── phone-normalizer.ts
└── hooks/                    # Custom React hooks
    ├── use-car.ts
    ├── use-members.ts
    └── use-balances.ts
```

**Example Refactoring:**

**Before** (in page component):
```typescript
// app/(app)/members/page.tsx
const { data: members } = await supabase
  .from('members')
  .select('*')
  .eq('car_id', carId)
  .order('name');
```

**After:**
```typescript
// lib/queries/members.ts
export async function getCarMembers(supabase: SupabaseClient, carId: string) {
  const { data, error } = await supabase.rpc('get_car_members', {
    p_car_id: carId
  });

  if (error) throw new Error(`Failed to fetch members: ${error.message}`);
  return data as Member[];
}

// lib/services/member-sorter.ts
export function sortMembersByPriority(members: Member[], currentUserId: string) {
  // Sort logic: current user first, then members, then guests
  return members.sort((a, b) => {
    if (a.user_id === currentUserId) return -1;
    if (b.user_id === currentUserId) return 1;
    if (a.is_guest !== b.is_guest) return a.is_guest ? 1 : -1;
    return a.name.localeCompare(b.name);
  });
}

// lib/hooks/use-members.ts
export function useMembers(carId: string) {
  const { user } = useAuth();
  const supabase = createClient();

  const { data: members, isLoading } = useSWR(
    ['members', carId],
    () => getCarMembers(supabase, carId)
  );

  const sortedMembers = members
    ? sortMembersByPriority(members, user.id)
    : [];

  return { members: sortedMembers, isLoading };
}

// app/(app)/members/page.tsx - Now much cleaner!
export default function MembersPage() {
  const { members, isLoading } = useMembers(carId);
  return <DataTable data={members} columns={columns} />;
}
```

**Benefits:**
- Easier to test (pure functions)
- Reusable query logic
- Cleaner page components
- Better error handling
- Easier to optimize (caching, etc.)

**Migration Strategy:**
1. Create new directory structure
2. Move query logic to `lib/queries/`
3. Extract business logic to `lib/services/`
4. Create custom hooks for common patterns
5. Update page components to use new structure
6. Add tests for business logic

---

### 5. RLS Policy Strategy - REVISED ✅

**Problem:**
- Multiple migrations creating/updating policies (008-019 show ~12 RLS-related migrations)
- Auth system changing from Supabase UUID to Clerk text IDs
- Schema changing (adding invite_code to members, simplifying users table)
- Would need to redo all policies after Clerk migration anyway

**Revised Solution: Temporarily Disable RLS, Fresh Design After Migration**

**Decision**:
- ✅ **Disable RLS temporarily** (migration 020)
- ✅ **Keep SECURITY DEFINER functions** - they're useful for query layer
- ✅ **Document current functions** (see `docs/DATABASE_FUNCTIONS.md`)
- 🔜 **Design fresh RLS** after Clerk + invite system are implemented

**Rationale:**
1. Current RLS is complex and has been patched multiple times
2. Clerk uses different auth.uid() approach (text vs uuid)
3. New schema requires different policies (invite system)
4. More efficient to design RLS once with final structure

**What We're Keeping:**

Database functions (documented in `docs/DATABASE_FUNCTIONS.md`):
- `get_user_car(p_user_id)` - Get car for owner/member
- `get_car_members(p_user_id)` - Get all members
- `get_car_fuel_fills(p_user_id)` - Get fuel fills with payer names
- `get_car_trips(p_user_id)` - Get all trips
- `get_car_settlements(p_user_id)` - Get settlements with names
- `auto_link_member_by_phone(p_phone, p_user_id)` - Auto-link members

These functions will be updated for Clerk auth in Phase 2.

**Migration 020**: `disable_rls_for_refactor.sql`
- Disables RLS on all tables
- Drops all existing policies
- Keeps all SECURITY DEFINER functions
- Well-documented for future reference

**Fresh RLS Design** (after Phase 2):
Will implement clean policies with:
- Clerk auth integration (text user IDs)
- Invite system support
- Clear naming convention
- Comprehensive testing
- Full documentation in `docs/DATABASE_SECURITY.md`

---

## Implementation Priority

### Phase 1: Foundation (Critical)
1. **Database Types** - Establish type safety first
2. **Code Refactoring** - Clean architecture for easier changes
3. **RLS Audit** - Ensure security before adding features

### Phase 2: User Experience (High Priority)
4. **Clerk Migration** - Better auth experience
5. **Invite System** - Improved onboarding

### Phase 3: Polish (Medium Priority)
- Error handling improvements
- Loading states
- Mobile optimization
- Performance tuning

## Success Metrics

**Before Refactoring:**
- ~10 migration files with overlapping policies
- Types defined in 5+ different files
- Database queries in page components
- Auth tied to Supabase

**After Refactoring:**
- Single source of truth for types
- Clean RLS with <10 policies per table
- Separated concerns (queries, actions, services)
- Flexible auth with Clerk
- Easy invite sharing

## Migration Checklist

### Phase 1: Foundation ✅ COMPLETE
- [x] Set up type generation workflow
- [x] Create new directory structure (lib/types, lib/queries, lib/actions, lib/services)
- [x] Refactor queries and business logic
- [x] Update all components to use new structure
- [x] Split functions for single responsibility (getUserCarId → getOwnedCarId + getMemberCarId)
- [x] Implement Pick/Omit types in server actions
- [x] Consistent error handling across queries
- [ ] Audit and document current RLS policies (NEXT)

### Phase 2: User Experience
- [ ] Implement invite system
- [ ] Set up Clerk authentication
- [ ] Migrate existing users

### Phase 3: Testing & Deployment
- [ ] Write tests for critical business logic
- [ ] Update documentation
- [ ] Deploy to staging
- [ ] Test thoroughly
- [ ] Deploy to production

## Notes

- Keep MVP running while refactoring
- Make changes incrementally
- Test each phase before moving to next
- Document breaking changes
- Consider feature flags for gradual rollout

---

## Decisions Made

1. **Clerk Auth**: ✅ Email + phone (configured in Clerk dashboard)
2. **Invite System**: ✅ 1:1 member invites (one code per member)
3. **User Table**: ✅ Minimal - just store Clerk user ID, nothing else
4. **Member Linking**: ✅ Direct via Clerk user ID (no email/phone matching)
5. **Branch Strategy**: ✅ Work in `feature/v2-refactor` branch
6. **Type Safety**: ✅ Use Pick/Omit in actions, explicit input types
7. **Error Handling**: ✅ Throw errors in queries (consistent approach)
8. **Function Design**: ✅ Single-purpose functions (SRP)

---

## Progress Summary

**Current Branch**: `feature/auth-improvement`

**Latest Session (Complete Database Schema Redesign)**:
1. Cleared database and started fresh with migration 022
2. Redesigned schema with learnings from MVP:
   - `fuel_fills` → `expenses` (supports all expense types)
   - Roles: `owner`/`guest` with `is_admin` flag
   - Force metric units (km, litres) in backend
   - Auto-generated `invite_code` per member
   - Settlement status tracking (`pending`/`settled`)
   - Removed phone field (invite via code instead)
3. Complete type refactor - fixed all type safety issues:
   - Removed ALL `any` types from codebase
   - Replaced inline logic with helper functions
   - All column types use Pick/Omit from database types
   - Created proper table row types: `BalanceTableRow`, `ExpenseTableRow`, `SettlementTableRow`, `TripTableRow`
   - Removed obsolete conversion functions
4. Updated all pages to use new schema
5. Started Clerk integration (middleware, env vars configured)

**Previous Commits** (Phase 1.1 & 1.2):
1. Made the plan (PLAN-V2.md)
2. Added Supabase CLI and types
3. Database types and code refactoring foundation
4. Server actions and refactored pages
5. Pick/Omit types in server actions
6. Error handling improvements
7. Single-purpose functions

**Files Created/Modified** (This Session):
- `supabase/migrations/022_fresh_schema_redesign.sql` - Complete schema redesign
- `supabase/migrations/023_cleanup_old_functions.sql` - Cleaned up UUID function signatures
- `lib/types/balance.ts` - Added `BalanceTableRow` type
- `lib/types/expense.ts` - NEW: Replaced fuel-fill types with expense types
- `lib/types/member.ts` - Removed phone, added helpers (getFirstName, getInitials)
- `lib/queries/expenses.ts` - NEW: Replaced fuel-fills queries
- `lib/actions/expense-actions.ts` - NEW: Generic expense actions
- `lib/services/balance-calculator.ts` - Made generic for any member type
- `lib/services/member-sorter.ts` - Added `MemberGroups` export type
- `components/balances/columns.tsx` - Uses `BalanceTableRow` with Pick/Omit
- `components/expenses/columns.tsx` - Uses `ExpenseTableRow` with Pick
- `components/settlements/columns.tsx` - Uses `SettlementTableRow` with Pick
- `components/trips/columns.tsx` - Uses `TripTableRow` with Pick
- `components/members/columns.tsx` - Uses `MemberFromFunction` directly
- Updated ALL pages: balances, fuel, trips, settlements, members, dashboard
- Removed `lib/queries/fuel-fills.ts` - obsolete
- Removed phone-related UI components and logic
- Build passing ✅

**Phase 1.1 & 1.2 Status**: ✅ COMPLETE
- Type generation workflow established
- Clean architecture implemented
- Type safety with Pick/Omit throughout
- Error handling consistent
- Single-purpose functions
- NO `any` types in codebase
- Helper functions for all repeated logic
- Column types derived from database types

**Phase 2.1: Clerk Migration**: ✅ COMPLETE
- ✅ Clerk SDK installed and configured
- ✅ Middleware protecting all routes (secure by default)
- ✅ Landing page with Clerk sign-in/sign-up buttons
- ✅ App navbar with `<UserButton>` and first name display
- ✅ Dashboard with onboarding modal (car setup form)
- ✅ Users synced to Supabase (Clerk ID + full name)
- ✅ All pages working with Clerk auth via `useAuth()` wrapper hook
- ✅ Removed old Supabase auth pages and components
- ✅ Breadcrumb uses capitalize helper instead of mapping

**Next**: Phase 2.2 - Implement Invite System with shareable codes

## Open Questions

1. **Type Generation**: Manual or automated (CI/CD hook)?
2. **Testing**: Unit tests, integration tests, or E2E tests first?
3. **Deployment**: Blue-green deployment or feature flags for migration?
4. **RLS Cleanup**: When to tackle Phase 1.3 vs moving to Phase 2?
