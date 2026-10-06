-- =============================================================================
-- LOG POSE TCG - ADMIN RECYCLE USER RPC
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/miywbfkbdscnzxbnycme/sql
-- =============================================================================

CREATE OR REPLACE FUNCTION public.admin_recycle_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can recycle accounts.';
  END IF;

  -- 1. Delete user collection cards
  DELETE FROM public.user_cards WHERE user_id = target_user_id;

  -- 2. Delete user card sales
  DELETE FROM public.card_sales WHERE user_id = target_user_id;

  -- 3. Delete friendships
  BEGIN
    DELETE FROM public.friendships WHERE user_id = target_user_id OR friend_id = target_user_id;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore if table doesn't exist
  END;

  -- 4. Delete from public profiles
  DELETE FROM public.profiles WHERE id = target_user_id;

  -- 5. Delete from auth.users (frees email for new registrations)
  BEGIN
    DELETE FROM auth.users WHERE id = target_user_id;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore if protected
  END;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
