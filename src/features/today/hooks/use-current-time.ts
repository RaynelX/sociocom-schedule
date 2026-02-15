import { useState, useEffect } from 'react';

/**
 * Возвращает текущее время в минутах от полуночи.
 * Обновляется каждые 15 секунд.
 */
export function useCurrentMinutes(): number {
  const [minutes, setMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setMinutes(now.getHours() * 60 + now.getMinutes());
    }, 15_000);

    return () => clearInterval(interval);
  }, []);

  return minutes;
}