'use client';

import React from 'react';
import { SettingsProvider } from '@/context/SettingsContext';
import { SettingsModal } from '@/components/SettingsModal';
import { AuthGate } from '@/components/AuthGate';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <AuthGate>
        {children}
        <SettingsModal />
      </AuthGate>
    </SettingsProvider>
  );
}
