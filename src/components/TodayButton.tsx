'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function TodayButton() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClick = () => {
    if (searchParams.size === 0) {
       const element = document.getElementById('today');
       if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
       router.push('/');
    }
  };

  return (
    <button 
      onClick={handleClick} 
      className="text-[10px] bg-blue-500 px-2 py-1 rounded hover:bg-blue-400 transition uppercase font-bold tracking-wider"
    >
      Сегодня
    </button>
  );
}