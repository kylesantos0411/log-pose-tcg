'use client';

import React from 'react';
import { SettingsProvider } from '@/context/SettingsContext';
import { SettingsModal } from '@/components/SettingsModal';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      {children}
      <SettingsModal />
    </SettingsProvider>
  );
}
