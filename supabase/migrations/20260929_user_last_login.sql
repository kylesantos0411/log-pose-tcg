-- =============================================================================
-- LOG POSE TCG - USER LAST LOGIN & APP ACTIVITY TRACKING MIGRATION
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/miywbfkbdscnzxbnycme/editor
-- =============================================================================

-- 1. Add last_login and last_active_at columns to public.profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- 2. Backfill existing profiles with best available timestamps
-- If linked to auth.users, use last_sign_in_at; otherwise use updated_at or created_at
DO $$
BEGIN
  -- Backfill from auth.users if available
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    UPDATE public.profiles p
    SET 
      last_login = COALESCE(p.last_login, u.last_sign_in_at, p.updated_at, p.created_at),
      last_active_at = COALESCE(p.last_active_at, p.updated_at, u.last_sign_in_at, p.created_at)
    FROM auth.users u
    WHERE p.id = u.id;
  END IF;

  -- Fallback for any profiles without auth.users match
  UPDATE public.profiles
  SET 
    last_login = COALESCE(last_login, updated_at, created_at, now()),
    last_active_at = COALESCE(last_active_at, updated_at, created_at, now())
  WHERE last_login IS NULL OR last_active_at IS NULL;
END $$;

-- 3. Touch activity RPC for authenticated users (called when user opens app or signs in)
CREATE OR REPLACE FUNCTION public.touch_user_activity(p_is_login BOOLEAN DEFAULT FALSE)
RETURNS VOID AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    UPDATE public.profiles
    SET 
      last_active_at = now(),
      last_login = CASE 
        WHEN p_is_login THEN now() 
        ELSE COALESCE(last_login, now()) 
      END,
      updated_at = now()
    WHERE id = auth.uid();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Secure admin RPC to fetch all users with auth-level and profile-level activity
CREATE OR REPLACE FUNCTION public.admin_get_users_activity()
RETURNS TABLE (
  id UUID,
  username TEXT,
  tag TEXT,
  email TEXT,
  role TEXT,
  is_banned BOOLEAN,
  ban_reason TEXT,
  banned_at TIMESTAMPTZ,
  rank TEXT,
  crew TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  auth_last_sign_in_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can view user activity telemetry.';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.tag,
    p.email,
    p.role,
    p.is_banned,
    p.ban_reason,
    p.banned_at,
    p.rank,
    p.crew,
    p.created_at,
    p.updated_at,
    p.last_login,
    p.last_active_at,
    u.last_sign_in_at AS auth_last_sign_in_at
  FROM public.profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  ORDER BY COALESCE(p.last_active_at, p.last_login, p.updated_at, p.created_at) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
