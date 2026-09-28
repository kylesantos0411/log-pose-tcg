-- =============================================================================
-- LOG POSE TCG - ADMIN CONTROL CENTER & MAINTENANCE SYSTEM MIGRATION
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/miywbfkbdscnzxbnycme/editor
-- =============================================================================

-- 1. Extend profiles table with role, ban status, and ban metadata
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ban_reason TEXT,
  ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;

-- 2. Automatically assign 'admin' role exclusively to kylesantos0411@gmail.com
UPDATE public.profiles
SET role = 'admin'
WHERE lower(email) = 'kylesantos0411@gmail.com';

-- 3. Create system_settings table for maintenance killswitch & global announcements
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT
);

-- Seed default settings
INSERT INTO public.system_settings (key, value)
VALUES 
  (
    'maintenance', 
    '{"enabled": false, "message": "Log Pose TCG is temporarily docking for scheduled maintenance and upgrades. We will be back online shortly!", "estimated_time": null}'::jsonb
  ),
  (
    'announcement', 
    '{"enabled": false, "message": "Welcome aboard Log Pose TCG!", "type": "info"}'::jsonb
  )
ON CONFLICT (key) DO NOTHING;

-- 4. Enable Row Level Security (RLS) on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can update system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can insert system settings" ON public.system_settings;

-- All users (including guests) can read system settings so they know if maintenance is on
CREATE POLICY "Anyone can read system settings"
  ON public.system_settings FOR SELECT
  USING (true);

-- Only users with role = 'admin' in profiles can update or insert system settings
CREATE POLICY "Admins can update system settings"
  ON public.system_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert system settings"
  ON public.system_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 5. Helper function to check if current caller is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Secure RPC: Admin can ban or unban any user with reason
CREATE OR REPLACE FUNCTION public.admin_set_user_ban(
  target_user_id UUID,
  should_ban BOOLEAN,
  reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can manage bans.';
  END IF;

  UPDATE public.profiles
  SET 
    is_banned = should_ban,
    ban_reason = CASE WHEN should_ban THEN reason ELSE NULL END,
    banned_at = CASE WHEN should_ban THEN now() ELSE NULL END
  WHERE id = target_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Secure RPC: Admin can delete any fraudulent card sale
CREATE OR REPLACE FUNCTION public.admin_delete_sale(target_sale_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can delete sales.';
  END IF;

  DELETE FROM public.card_sales WHERE id = target_sale_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Secure RPC: Admin can dismiss flags on a legitimate card sale
CREATE OR REPLACE FUNCTION public.admin_dismiss_flags(target_sale_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can dismiss flags.';
  END IF;

  UPDATE public.card_sales
  SET flags_count = 0
  WHERE id = target_sale_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
