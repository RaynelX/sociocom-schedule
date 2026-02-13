import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef,
    type ReactNode,
  } from 'react';
  import { useDatabase } from '../../app/providers/DatabaseProvider';
  import { SyncEngine, type SyncStatus } from './sync-engine';
  
  // ============================================================
  // Контекст
  // ============================================================
  
  interface SyncContextValue {
    status: SyncStatus;
    triggerSync: () => void;
  }
  
  const SyncContext = createContext<SyncContextValue | null>(null);
  
  // ============================================================
  // Провайдер
  // ============================================================
  
  export function SyncProvider({ children }: { children: ReactNode }) {
    const db = useDatabase();
    const engineRef = useRef<SyncEngine | null>(null);
  
    const [status, setStatus] = useState<SyncStatus>({
      state: 'idle',
      lastSyncAt: null,
    });
  
    // Инициализация движка
    useEffect(() => {
      const engine = new SyncEngine(db);
      engineRef.current = engine;
  
      // Подписка на статус
      const sub = engine.status$.subscribe(setStatus);
  
      // Первый запуск синхронизации
      engine.sync();
  
      // Синхронизация при возврате в приложение
      const handleVisibility = () => {
        if (document.visibilityState === 'visible') {
          engine.sync();
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);
  
      // Синхронизация при восстановлении сети
      const handleOnline = () => {
        engine.sync();
      };
      window.addEventListener('online', handleOnline);
  
      // Обновление статуса при потере сети
      const handleOffline = () => {
        setStatus(prev => ({ ...prev, state: 'offline' }));
      };
      window.addEventListener('offline', handleOffline);
  
      return () => {
        sub.unsubscribe();
        document.removeEventListener('visibilitychange', handleVisibility);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }, [db]);
  
    const triggerSync = useCallback(() => {
      engineRef.current?.sync();
    }, []);
  
    return (
      <SyncContext.Provider value={{ status, triggerSync }}>
        {children}
      </SyncContext.Provider>
    );
  }
  
  // ============================================================
  // Хук
  // ============================================================
  
  export function useSync(): SyncContextValue {
    const ctx = useContext(SyncContext);
    if (!ctx) {
      throw new Error('useSync() must be used within <SyncProvider>');
    }
    return ctx;
  }