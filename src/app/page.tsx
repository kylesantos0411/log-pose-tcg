import { prisma } from '@/lib/prisma';
import { CleanHomeView } from '@/components/CleanHomeView';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let totalCards = 0;
  let totalPacks = 0;
  let userCardsCount = 0;
  let featuredCards: Array<{ id: string; name: string; imageUrl: string | null }> = [];

  try {
    const [cardCount, packCount, userCards, featured] = await Promise.all([
      prisma.card.count(),
      prisma.pack.count(),
      prisma.userCard.findMany({ select: { quantity: true } }),
      prisma.card.findMany({
        where: {
          imageUrl: { not: null },
          OR: [
            { id: 'OP05-119_p1' },
            { id: 'OP09-050_p3' },
            { id: 'EB01-006_p2' },
            { id: 'OP01-120_p1' },
            { id: 'OP06-118_p1' },
            { id: 'OP14-108_p3' },
          ],
        },
        select: { id: true, name: true, imageUrl: true, rarity: true, yuyuPrice: true, marketPrice: true },
        take: 6,
      }),
    ]);

    totalCards = cardCount;
    totalPacks = packCount;
    featuredCards = featured;
    for (const uc of userCards) {
      userCardsCount += uc.quantity || 1;
    }
  } catch (e) {
    // Graceful fallback if database is querying
  }

  return (
    <CleanHomeView
      totalCards={totalCards}
      totalPacks={totalPacks}
      userCardsCount={userCardsCount}
      featuredCards={featuredCards}
    />
  );
}
