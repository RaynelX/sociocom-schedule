import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { getDatabase } from '../../database/db';
import type { AppDatabase } from '../../database/types';

const DatabaseContext = createContext<AppDatabase | null>(null);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<AppDatabase | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDatabase()
      .then(setDb)
      .catch((err) => {
        console.error('[DB] Failed to initialize:', err);
        setError(err.message);
      });
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen p-4 text-center bg-white dark:bg-black">
        <div>
          <p className="text-red-600 font-medium">Ошибка инициализации</p>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!db) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-black">
        <p className="text-gray-500 dark:text-neutral-400">Загрузка...</p>
      </div>
    );
  }

  return (
    <DatabaseContext.Provider value={db}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase(): AppDatabase {
  const db = useContext(DatabaseContext);
  if (!db) {
    throw new Error('useDatabase() must be used within <DatabaseProvider>');
  }
  return db;
}