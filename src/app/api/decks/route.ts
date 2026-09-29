import { NextResponse } from 'next/server';
import { RECOMMENDED_DECKS, getDeckById } from '@/lib/recommended-decks';
import { sanitizeIdentifier } from '@/lib/sanitizer';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawId = searchParams.get('id');
  const id = sanitizeIdentifier(rawId);

  if (rawId) {
    if (!id) {
      return NextResponse.json({ error: 'Invalid deck id' }, { status: 400 });
    }
    const deck = getDeckById(id);
    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }
    return NextResponse.json({ deck });
  }

  return NextResponse.json({
    decks: RECOMMENDED_DECKS,
    total: RECOMMENDED_DECKS.length
  });
}
