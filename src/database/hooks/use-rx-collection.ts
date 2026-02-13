import { useState, useEffect } from 'react';
import type { RxCollection, MangoQuery, RxDocument } from 'rxdb';

export function useRxCollection<T>(
  collection: RxCollection<T>,
  query?: MangoQuery<T>,
): { data: T[]; loading: boolean } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  // Стабилизация: эффект перезапускается только при изменении
  // содержимого запроса, а не ссылки на объект
  const queryKey = JSON.stringify(query);

  useEffect(() => {
    setLoading(true);

    const rxQuery = query
      ? collection.find(query)
      : collection.find();

    const sub = rxQuery.$.subscribe((results: RxDocument<T>[]) => {
      setData(results.map((doc) => doc.toMutableJSON()));
      setLoading(false);
    });

    return () => sub.unsubscribe();
  }, [collection, queryKey]);

  return { data, loading };
}