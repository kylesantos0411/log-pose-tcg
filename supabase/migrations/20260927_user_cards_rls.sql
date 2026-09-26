-- =============================================================================
-- LOG POSE TCG - ALLOW VIEWING PUBLIC BINDER CARDS ACROSS COLLECTORS
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/miywbfkbdscnzxbnycme/editor
-- =============================================================================

-- Drop the old restrictive select policy
DROP POLICY IF EXISTS "Users can view their own cards." ON public.user_cards;
DROP POLICY IF EXISTS "Public cards are viewable by everyone" ON public.user_cards;
DROP POLICY IF EXISTS "Allow users to view collection cards" ON public.user_cards;

-- Allow all authenticated users and visitors to view public collection cards (is_wishlist = false),
-- while keeping private wishlist cards visible only to their owners.
CREATE POLICY "Allow users to view collection cards"
  ON public.user_cards FOR SELECT
  USING ( is_wishlist = false OR auth.uid() = user_id );
