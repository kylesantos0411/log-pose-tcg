-- =============================================================================
-- LOG POSE TCG - COLLECTION SOLD CARDS & COMMUNITY SALES REFERENCE
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
  user_card_id    TEXT, -- Reference to the collection record id (or uuid)
  card_id         TEXT NOT NULL, -- Canonical card variant id e.g. 'OP05-119_p2'
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
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for lightning-fast queries on card detail pages and user history
CREATE INDEX IF NOT EXISTS idx_card_sales_card_id ON public.card_sales(card_id, is_public, sold_date DESC);
CREATE INDEX IF NOT EXISTS idx_card_sales_user_id ON public.card_sales(user_id, sold_date DESC);
CREATE INDEX IF NOT EXISTS idx_card_sales_date ON public.card_sales(sold_date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.card_sales ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Public sales are viewable by everyone" ON public.card_sales;
DROP POLICY IF EXISTS "Users can insert their own sales" ON public.card_sales;
DROP POLICY IF EXISTS "Users can update their own sales" ON public.card_sales;
DROP POLICY IF EXISTS "Users can delete their own sales" ON public.card_sales;

-- RLS Policies for card_sales:
-- Anyone (including public / community) can view public sales.
-- Private sales (is_public = false) can ONLY be seen by their owner.
CREATE POLICY "Public sales are viewable by everyone"
  ON public.card_sales FOR SELECT
  USING ( is_public = true OR auth.uid() = user_id );

-- Only authenticated owners can insert their own sales
CREATE POLICY "Users can insert their own sales"
  ON public.card_sales FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

-- Only the owner can update their own sales
CREATE POLICY "Users can update their own sales"
  ON public.card_sales FOR UPDATE
  USING ( auth.uid() = user_id );

-- Only the owner can delete their own sales (or undo sale)
CREATE POLICY "Users can delete their own sales"
  ON public.card_sales FOR DELETE
  USING ( auth.uid() = user_id );
