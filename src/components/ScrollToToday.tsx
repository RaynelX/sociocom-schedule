'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function ScrollToToday() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleScroll = () => {
      if (pathname === '/' && searchParams.size === 0) {
        
        let attempts = 0;
        const interval = setInterval(() => {
          const element = document.getElementById('today');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            clearInterval(interval);
          }
          
          attempts++;
          if (attempts > 10) clearInterval(interval);
        }, 100);
      }
    };

    handleScroll();
  }, [pathname, searchParams]);

  return null;
}