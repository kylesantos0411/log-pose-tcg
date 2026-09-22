import { NextResponse } from 'next/server';
import { RECOMMENDED_DECKS, getDeckById } from '@/lib/recommended-decks';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
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
