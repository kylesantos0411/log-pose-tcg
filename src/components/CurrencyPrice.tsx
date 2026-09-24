'use client';

import React from 'react';
import { useSettings } from '@/context/SettingsContext';

interface CurrencyPriceProps {
  amountUSD: number;
  source?: 'yuyutei' | 'cardmarket' | 'ebay' | 'snkrdunk' | 'psa' | 'generic';
  lang?: 'en' | 'jp';
  className?: string;
  decimals?: number;
}

export function CurrencyPrice({
  amountUSD,
  source = 'generic',
  lang = 'jp',
  className = '',
  decimals,
}: CurrencyPriceProps) {
  const { formatPrice } = useSettings();
  const res = formatPrice(amountUSD, { source, lang, decimals });
  return <span className={className}>{res.full}</span>;
}
