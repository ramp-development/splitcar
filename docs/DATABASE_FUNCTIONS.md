# Database Functions Reference

This document lists all SECURITY DEFINER functions in the database and their purpose.

## Query Functions (SECURITY DEFINER)

These functions bypass RLS to provide data access. They're currently used by the query layer in `lib/queries/`.

### `get_user_car(p_user_id text)`

**Purpose**: Get car details for a user (either as owner or member)

**Returns**: Array of car records (should be 0 or 1)

**Used by**: `lib/queries/cars.ts` - `getUserCar()`

**Migration**: `016_get_user_car_function.sql`

```sql
SELECT c.* FROM cars c
WHERE c.owner_id = p_user_id
UNION
SELECT c.* FROM cars c
INNER JOIN members m ON m.car_id = c.id
WHERE m.user_id = p_user_id
LIMIT 1;
```

---

### `get_car_members(p_user_id text)`

**Purpose**: Get all members for the user's car

**Returns**: Array of member records

**Used by**: `lib/queries/members.ts` - `getCarMembers()`

**Migration**: `015_get_car_members_function.sql`

```sql
SELECT m.* FROM members m
INNER JOIN cars c ON c.id = m.car_id
WHERE c.owner_id = p_user_id OR m.user_id = p_user_id;
```

---

### `get_car_fuel_fills(p_user_id text)`

**Purpose**: Get all fuel fills for the user's car with payer names

**Returns**: Array of fuel fill records with payer_name

**Used by**: `lib/queries/fuel-fills.ts` - `getCarFuelFills()`

**Migration**: `017_get_car_fuel_fills_function.sql`

```sql
SELECT
  f.*,
  m.name as payer_name
FROM fuel_fills f
INNER JOIN members m ON m.id = f.payer_member_id
INNER JOIN cars c ON c.id = f.car_id
WHERE c.owner_id = p_user_id OR EXISTS (
  SELECT 1 FROM members mem
  WHERE mem.car_id = c.id AND mem.user_id = p_user_id
);
```

---

### `get_car_trips(p_user_id text)`

**Purpose**: Get all trips for the user's car

**Returns**: Array of trip records

**Used by**: `lib/queries/trips.ts` - `getCarTrips()`

**Migration**: `018_get_car_trips_function.sql`

```sql
SELECT t.* FROM trips t
INNER JOIN cars c ON c.id = t.car_id
WHERE c.owner_id = p_user_id OR EXISTS (
  SELECT 1 FROM members m
  WHERE m.car_id = c.id AND m.user_id = p_user_id
);
```

---

### `get_car_settlements(p_user_id text)`

**Purpose**: Get all settlements for the user's car with member names

**Returns**: Array of settlement records with from_member_name and to_member_name

**Used by**: `lib/queries/settlements.ts` - `getCarSettlements()`

**Migration**: `019_get_car_settlements_function.sql`

```sql
SELECT
  s.*,
  m1.name as from_member_name,
  m2.name as to_member_name
FROM settlements s
INNER JOIN members m1 ON m1.id = s.from_member_id
INNER JOIN members m2 ON m2.id = s.to_member_id
INNER JOIN cars c ON c.id = s.car_id
WHERE c.owner_id = p_user_id OR EXISTS (
  SELECT 1 FROM members m
  WHERE m.car_id = c.id AND m.user_id = p_user_id
);
```

---

## Mutation Functions (SECURITY DEFINER)

### `auto_link_member_by_phone(p_phone text, p_user_id text)`

**Purpose**: Automatically link a member record to a user when they log in with matching phone

**Returns**: Boolean (success/failure)

**Used by**: Auth flow (currently Supabase, will update for Clerk)

**Migration**: `009_member_auto_link_function.sql`

**Note**: This function will need updating for Clerk auth, which may use email instead of phone.

```sql
UPDATE members
SET user_id = p_user_id
WHERE phone = p_phone AND user_id IS NULL;
```

---

## Migration Plan for Clerk

When migrating to Clerk, these functions will need updates:

1. **Change `p_user_id` parameter** from `uuid` to `text` (Clerk IDs)
2. **Update `auto_link_member_by_phone`** to handle email/phone linking
3. **Keep the same function signatures** where possible for backward compatibility
4. **Add new functions** if needed for invite system

## Why Keep SECURITY DEFINER Functions?

Even without RLS, these functions are valuable:

- **Centralize business logic** (e.g., joining member names)
- **Consistent data access** patterns
- **Easier to update** later (change function vs all queries)
- **Type generation** - they show up in database.types.ts
- **Future RLS** - functions can enforce security when we re-enable

## Current Status

- ✅ All functions defined and working
- ⏳ RLS temporarily disabled (migration 020)
- 🔜 Will update for Clerk auth in Phase 2
- 🔜 Will add new RLS policies in Phase 1.3 (after Clerk migration)
