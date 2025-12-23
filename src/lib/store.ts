// lib/store.ts

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval'; // Твоя библиотека для IndexedDB
import { BellSchedule, CalendarEvent, ScheduleItem, Subject } from './types/index';

// Интерфейс состояния
interface AppState {
  subjects: Subject[];
  scheduleItems: ScheduleItem[];
  events: CalendarEvent[];
  bellSchedule: BellSchedule[];
  
  // Метаданные
  lastUpdated: number; // Timestamp последнего обновления с сервера
  isLoading: boolean;
  
  // Actions
  setAllData: (data: { 
    subjects: Subject[]; 
    scheduleItems: ScheduleItem[]; 
    events: CalendarEvent[]; 
    bellSchedule: BellSchedule[] 
  }) => void;
  
  setLoading: (loading: boolean) => void;
}

// Адаптер для IndexedDB (так как zustand по умолчанию хочет синхронный localStorage)
const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    // console.log(name, "has been retrieved");
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    // console.log(name, "with value", value, "has been saved");
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      subjects: [],
      scheduleItems: [],
      events: [],
      bellSchedule: [],
      lastUpdated: 0,
      isLoading: true, // По умолчанию грузимся, пока не восстановим стейт

      setAllData: (data) => set({ 
        ...data, 
        lastUpdated: Date.now(),
        isLoading: false 
      }),

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'schedule-storage-v1', // Имя ключа в IndexedDB
      storage: createJSONStorage(() => storage),
      // Важно: skipHydration: true не ставим, пусть гидрирует автоматически
      onRehydrateStorage: () => (state) => {
        // Когда данные загрузились из IDB
        state?.setLoading(false);
      },
    }
  )
);