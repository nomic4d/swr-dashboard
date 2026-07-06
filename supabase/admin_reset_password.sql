-- Run this in Supabase SQL Editor
-- Allows admin to directly reset any user's password

CREATE OR REPLACE FUNCTION public.admin_reset_password(target_user_id UUID, new_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'auth', 'public'
AS $$
DECLARE
  caller_id UUID;
  caller_role TEXT;
BEGIN
  caller_id := auth.uid();

  SELECT role INTO caller_role FROM public.profiles WHERE id = caller_id;

  IF caller_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Only admins can reset passwords';
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = target_user_id;

  RETURN FOUND;
END;
$$;
