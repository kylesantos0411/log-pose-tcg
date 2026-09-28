/**
 * eBay Pricing Engine for Vintage One Piece Cards (Carddass Hyper Battle, etc.)
 */

export function generateEbaySoldSearchUrl(
  cardNumber?: string | null,
  cardName?: string | null,
  _series?: string
): string {
  const num = (cardNumber || '').trim();
  let name = (cardName || '').trim();
  name = name.replace(/^Monkey\.?D\.?/i, 'Luffy').replace(/^Roronoa\s*/i, '').trim();
  const firstName = name.split(' ')[0] || '';

  // E.g.: "One Piece" Carddass "C01" Luffy -OP01 -OP02 -OP03 -OP05 -EB01
  const query = `"One Piece" Carddass "${num}" ${firstName} -OP01 -OP02 -OP03 -OP05 -EB01`;

  const params = new URLSearchParams({
    _nkw: query,
    LH_Complete: '1',
    LH_Sold: '1',
    _sop: '12', // Most recent first
  });

  return `https://www.ebay.com/sch/i.html?${params.toString()}`;
}

export function formatEbayPrice(
  usdPrice: number | null | undefined,
  targetCurrency: 'USD' | 'JPY' | 'PHP' | 'EUR' = 'USD'
): { formatted: string; rawUsd: number } {
  if (!usdPrice || usdPrice <= 0) {
    return { formatted: 'Check eBay', rawUsd: 0 };
  }

  // Currency exchange rates (synced with app's settings rates)
  const rates: Record<string, number> = {
    USD: 1.0,
    JPY: 155.0,
    PHP: 58.5,
    EUR: 0.92,
  };

  const rate = rates[targetCurrency] || 1.0;
  const converted = usdPrice * rate;

  let formatted = '';
  switch (targetCurrency) {
    case 'USD':
      formatted = `$${usdPrice.toFixed(2)}`;
      break;
    case 'JPY':
      formatted = `¥${Math.round(converted).toLocaleString()}`;
      break;
    case 'PHP':
      formatted = `₱${Math.round(converted).toLocaleString()}`;
      break;
    case 'EUR':
      formatted = `€${converted.toFixed(2)}`;
      break;
  }

  return { formatted, rawUsd: usdPrice };
}
