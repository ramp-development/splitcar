-- Create a secure function to handle member auto-linking
-- This bypasses RLS since it runs with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.auto_link_member_by_phone(
  p_user_id UUID,
  p_phone TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_id UUID;
  v_member_name TEXT;
  v_normalized_user_phone TEXT;
  v_normalized_member_phone TEXT;
BEGIN
  -- Normalize the input phone (remove +)
  v_normalized_user_phone := REPLACE(p_phone, '+', '');

  -- Find a member with matching phone that has no user_id yet
  SELECT id, name, REPLACE(phone, '+', '')
  INTO v_member_id, v_member_name, v_normalized_member_phone
  FROM members
  WHERE user_id IS NULL
    AND phone IS NOT NULL
    AND REPLACE(phone, '+', '') = v_normalized_user_phone
  LIMIT 1;

  -- If we found a matching member, link them
  IF v_member_id IS NOT NULL THEN
    -- Link the member to the user
    UPDATE members
    SET user_id = p_user_id
    WHERE id = v_member_id;

    -- Copy member name to user if user doesn't have a name
    UPDATE users
    SET name = v_member_name
    WHERE id = p_user_id
      AND (name IS NULL OR name = '');

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.auto_link_member_by_phone(UUID, TEXT) TO authenticated;
