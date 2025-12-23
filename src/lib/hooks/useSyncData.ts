"use client";

import { useEffect } from "react";
import { createClient } from "../supabase/client";
import { useAppStore } from "@/lib/store";
import { 
  BellSchedule, 
  CalendarEvent, 
  ScheduleItem, 
  Subject 
} from "../types/index";

export function useSyncData() {
  const setAllData = useAppStore((state) => state.setAllData);
  const setLoading = useAppStore((state) => state.setLoading);
  
  const supabase = createClient();

  useEffect(() => {
    const sync = async () => {
      console.log("🔄 Starting data sync...");
      
      try {
        // Запрашиваем все таблицы параллельно
        const [
          bellRes, 
          subjectsRes, 
          eventsRes, 
          scheduleRes
        ] = await Promise.all([
          supabase.from("bell_schedule").select("*").order("pair_number"),
          supabase.from("subjects").select("*"),
          supabase.from("events").select("*"), // Можно добавить фильтр по дате, чтобы не тянуть старое
          supabase.from("schedule_items").select("*"),
        ]);

        if (bellRes.error) throw bellRes.error;
        if (subjectsRes.error) throw subjectsRes.error;
        if (eventsRes.error) throw eventsRes.error;
        if (scheduleRes.error) throw scheduleRes.error;

        // Обновляем стор одной транзакцией
        setAllData({
          bellSchedule: bellRes.data as BellSchedule[],
          subjects: subjectsRes.data as Subject[],
          events: eventsRes.data as CalendarEvent[],
          scheduleItems: scheduleRes.data as ScheduleItem[],
        });
        
        console.log("✅ Data sync complete");
      } catch (error) {
        console.error("❌ Sync failed:", error);
        // Тут можно добавить тост-уведомление об ошибке сети
      } finally {
        setLoading(false);
      }
    };

    sync();
  }, [setAllData, setLoading]);
}