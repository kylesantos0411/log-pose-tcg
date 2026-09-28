-- =============================================================================
-- LOG POSE TCG - COMPLETE CARD SALES & ANTI-MANIPULATION SETUP
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/miywbfkbdscnzxbnycme/editor
-- =============================================================================

-- 1. Extend user_cards with status and sold metadata
ALTER TABLE public.user_cards 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'OWNED' CHECK (status IN ('OWNED', 'SOLD')),
  ADD COLUMN IF NOT EXISTS sold_price NUMERIC,
  ADD COLUMN IF NOT EXISTS sold_currency TEXT DEFAULT 'PHP',
  ADD COLUMN IF NOT EXISTS sold_date DATE,
  ADD COLUMN IF NOT EXISTS is_public_sale BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS buyer_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_user_cards_status ON public.user_cards(user_id, status);

-- 2. Create card_sales table for community sales reference & transaction history
CREATE TABLE IF NOT EXISTS public.card_sales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_card_id    TEXT,
  card_id         TEXT NOT NULL,
  card_name       TEXT,
  condition       TEXT NOT NULL DEFAULT 'NM',
  is_foil         BOOLEAN NOT NULL DEFAULT false,
  language        TEXT NOT NULL DEFAULT 'jp',
  sold_price      NUMERIC NOT NULL CHECK (sold_price > 0),
  sold_currency   TEXT NOT NULL DEFAULT 'PHP',
  sold_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  quantity        INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  is_public       BOOLEAN NOT NULL DEFAULT TRUE,
  buyer_source    TEXT,
  notes           TEXT,
  is_outlier      BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  flags_count     INTEGER NOT NULL DEFAULT 0,
  buyer_user_tag  TEXT,
  verified_by_buyer BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure all columns exist even if card_sales already existed
ALTER TABLE public.card_sales
  ADD COLUMN IF NOT EXISTS is_outlier BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS flags_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS buyer_user_tag TEXT,
  ADD COLUMN IF NOT EXISTS verified_by_buyer BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Indexes for fast queries, community protection, and mutual trade verifications
CREATE INDEX IF NOT EXISTS idx_card_sales_card_id ON public.card_sales(card_id, is_public, sold_date DESC);
CREATE INDEX IF NOT EXISTS idx_card_sales_user_id ON public.card_sales(user_id, sold_date DESC);
CREATE INDEX IF NOT EXISTS idx_card_sales_date ON public.card_sales(sold_date DESC);
CREATE INDEX IF NOT EXISTS idx_card_sales_protection ON public.card_sales(card_id, is_public, is_outlier, flags_count, sold_date DESC);
CREATE INDEX IF NOT EXISTS idx_card_sales_buyer_tag ON public.card_sales(buyer_user_tag, verified_by_buyer);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.card_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public sales are viewable by everyone" ON public.card_sales;
DROP POLICY IF EXISTS "Users can insert their own sales" ON public.card_sales;
DROP POLICY IF EXISTS "Users can update their own sales" ON public.card_sales;
DROP POLICY IF EXISTS "Users can delete their own sales" ON public.card_sales;

CREATE POLICY "Public sales are viewable by everyone"
  ON public.card_sales FOR SELECT
  USING ( is_public = true OR auth.uid() = user_id );

CREATE POLICY "Users can insert their own sales"
  ON public.card_sales FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update their own sales"
  ON public.card_sales FOR UPDATE
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can delete their own sales"
  ON public.card_sales FOR DELETE
  USING ( auth.uid() = user_id );

-- 5. Stored Procedures for anti-manipulation & trade verification
CREATE OR REPLACE FUNCTION public.report_suspicious_sale(target_sale_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.card_sales
  SET flags_count = flags_count + 1
  WHERE id = target_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.confirm_mutual_trade(target_sale_id UUID, buyer_tag TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  matched_sale RECORD;
BEGIN
  SELECT * INTO matched_sale FROM public.card_sales WHERE id = target_sale_id;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF lower(trim(coalesce(matched_sale.buyer_user_tag, ''))) = lower(trim(coalesce(buyer_tag, ''))) THEN
    UPDATE public.card_sales
    SET verified_by_buyer = TRUE, is_verified = TRUE, updated_at = now()
    WHERE id = target_sale_id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
