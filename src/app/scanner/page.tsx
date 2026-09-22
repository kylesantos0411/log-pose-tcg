'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ScannerPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/decks');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 text-gray-400 font-sans">
      <div className="w-8 h-8 border-2 border-[#f4727d] border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-xs font-semibold">Redirecting to Recommended Decks...</p>
    </div>
  );
}
