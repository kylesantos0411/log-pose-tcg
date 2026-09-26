-- Run this SQL in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/miywbfkbdscnzxbnycme/editor

-- Drop the restrictive user_cards select policy
DROP POLICY IF EXISTS "Users can view their own cards." ON public.user_cards;
DROP POLICY IF EXISTS "Users can view all collection cards." ON public.user_cards;

-- Allow collectors to view each other's collection binders & cards
CREATE POLICY "Users can view all collection cards."
  ON public.user_cards FOR SELECT
  USING ( true );
