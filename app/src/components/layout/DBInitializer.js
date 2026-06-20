'use client';

import { useEffect, useRef } from 'react';
import { seedDatabase } from '@/lib/seed';

export default function DBInitializer() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    seedDatabase().catch(console.error);
  }, []);

  return null;
}
