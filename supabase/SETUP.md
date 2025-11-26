# Supabase Setup Instructions

## 1. Run Database Migrations

In your Supabase dashboard:

1. Go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `migrations/001_initial_schema.sql`
4. Click **Run**
5. Repeat for `migrations/002_rls_policies.sql`

## 2. Enable Phone Authentication

1. Go to **Authentication** → **Providers**
2. Find **Phone** in the provider list
3. Enable it
4. Configure your phone provider settings:
   - For testing: Use Supabase's built-in test provider
   - For production: Configure Twilio or another SMS provider

### Testing Phone Auth Locally

For development, you can use Supabase's test phone numbers:
- Any phone number in format: `+1 (555) XXX-XXXX`
- OTP will always be: `123456`

## 3. Create a Database Function for User Creation

This function automatically creates a user record when someone signs up with phone auth:

```sql
-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, phone)
  VALUES (
    NEW.id,
    NEW.phone
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a new auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

Run this in the SQL Editor as well.

## 4. Verify Environment Variables

Make sure your `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=https://apoatvpadrsxjnmrlxyt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_SHbyYyBRQl0eyUEas7Czdg_fWV_H7le
SUPABASE_SERVICE_ROLE_KEY=sb_secret_FSPrG-aA8EJYI3RBP_WmrA_N6pLpw8q
```

## 5. Test the Setup

Start your dev server:
```bash
pnpm dev
```

The middleware will redirect unauthenticated users to `/login` (which we'll create in Phase 2).

## Notes

- **RLS (Row Level Security)** is enabled on all tables
- Users can only access data for cars they own or are members of
- Car owners have full control over their car's data
- Members can view and create fuel fills/trips but not delete them
- Phone auth uses Supabase's auth.users table, which is separate from our users table
- The trigger automatically syncs auth.users to our users table
