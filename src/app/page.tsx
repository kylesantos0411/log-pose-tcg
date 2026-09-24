import { prisma } from '@/lib/prisma';
import { CleanHomeView } from '@/components/CleanHomeView';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let totalCards = 0;
  let totalPacks = 0;
  let userCardsCount = 0;

  try {
    const [cardCount, packCount, userCards] = await Promise.all([
      prisma.card.count(),
      prisma.pack.count(),
      prisma.userCard.findMany({ select: { quantity: true } }),
    ]);

    totalCards = cardCount;
    totalPacks = packCount;
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
    />
  );
}
