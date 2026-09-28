-- =============================================================================
-- LOG POSE TCG - ANTI-MARKET-MANIPULATION & VERIFIED TRADE SYSTEM
-- Run in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/miywbfkbdscnzxbnycme/editor
-- =============================================================================

-- 1. Add verification, outlier, and community moderation columns
ALTER TABLE public.card_sales
  ADD COLUMN IF NOT EXISTS is_outlier BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS flags_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS buyer_user_tag TEXT,
  ADD COLUMN IF NOT EXISTS verified_by_buyer BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Indexes for high-performance filtered aggregates & mutual trade queries
CREATE INDEX IF NOT EXISTS idx_card_sales_protection 
  ON public.card_sales(card_id, is_public, is_outlier, flags_count, sold_date DESC);

CREATE INDEX IF NOT EXISTS idx_card_sales_buyer_tag 
  ON public.card_sales(buyer_user_tag, verified_by_buyer);

-- 3. Secure function to report a suspicious sale (increments flags_count)
CREATE OR REPLACE FUNCTION public.report_suspicious_sale(target_sale_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.card_sales
  SET flags_count = flags_count + 1
  WHERE id = target_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Secure function for buyer friend to confirm a trade
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
