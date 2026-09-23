import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { CardDetailView } from '@/components/CardDetailView';

interface Props {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ lang?: string }>;
}

export default async function CardPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const initialLanguage = sp.lang === 'jp' ? 'jp' : 'en';

  const card = await prisma.card.findUnique({
    where: { id },
    include: {
      pack: {
        select: {
          code: true,
          name: true,
        },
      },
    },
  });

  if (!card) {
    notFound();
  }

  // Find all sibling variants (same base physical card number across any set)
  const baseCardNumber = card.cardNumber || card.id.split('_')[0];
  const variants = await prisma.card.findMany({
    where: {
      OR: [
        { cardNumber: baseCardNumber },
        { id: baseCardNumber },
        { id: { startsWith: `${baseCardNumber}_` } },
      ],
    },
    include: {
      pack: {
        select: {
          code: true,
          name: true,
        },
      },
    },
    orderBy: { id: 'asc' },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-4 py-4">
      <Link
        href="/cards"
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-300 hover:text-white transition px-3.5 py-1.5 rounded-xl bg-[#242836] border border-[#343a4c] hover:bg-[#2d3244]"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Database
      </Link>

      <CardDetailView card={card} variants={variants} initialLanguage={initialLanguage} />
    </div>
  );
}
