'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';

export default function SettingsPage() {
  const router = useRouter();
  const { openSettings } = useSettings();

  useEffect(() => {
    openSettings();
    router.replace('/');
  }, [openSettings, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 text-gray-400 font-sans">
      <div className="w-8 h-8 border-2 border-[#e76d78] border-t-transparent rounded-full animate-spin mb-3" />
      <p className="text-xs font-semibold">Opening Application Settings...</p>
    </div>
  );
}
