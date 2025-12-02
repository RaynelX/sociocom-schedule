'use client';

import { useEffect } from 'react';

export default function ScrollToToday() {
  useEffect(() => {
    const timer = setTimeout(() => {
      const element = document.getElementById('today');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return null;
}