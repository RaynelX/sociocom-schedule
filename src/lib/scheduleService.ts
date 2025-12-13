import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { startOfWeek, endOfWeek, format, addWeeks, getDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

// ... ТВОИ ТИПЫ (LessonType, ScheduleItem, и т.д.) ОСТАВЛЯЕМ БЕЗ ИЗМЕНЕНИЙ ...
export type LessonType = 'lecture' | 'seminar' | 'lab' | 'other' | string;

export interface ScheduleDetail {
  id?: string | number;
  subgroup: string;
  teacher: string;
  room: string;
}

export interface ScheduleItem {
  id: number;
  subject: string;
  day_of_week: number;
  pair_number: number;
  type: LessonType;
  start_date: string;
  end_date: string;
  details: ScheduleDetail[];
}

export interface EventItem {
  id: number;
  title: string;
  date: string; 
  pair_number: number | null;
  type: LessonType; 
  subject: string | null;
  event_time: string | null;
  room: string | null;
}

export interface WeekData {
  schedule: ScheduleItem[];
  events: EventItem[];
  weekStart: Date;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function getNow(): Date {
  const nowUtc = new Date();
  return toZonedTime(nowUtc, 'Europe/Minsk');
}

export const getBells = unstable_cache(
  async () => {
    const { data } = await supabase.from('bell_schedule').select('*').order('pair_number');
    return data || [];
  },
  ['bell-schedule'], {revalidate: false, tags: ['schedule']}
);

async function fetchWeekSchedule(startStr:string, endStr:string) {
  console.log(`\x1b[31m🔥 [DB HIT] ЗАПРОС К БАЗЕ ДАННЫХ (${startStr} - ${endStr}) \x1b[0m`);
  
  try {
    const [scheduleResponse, eventsResponse] = await Promise.all([
      supabase
        .from("schedule_items")
        .select("*")
        .lte("start_date", endStr) 
        .gte("end_date", startStr),  

      supabase
        .from("events")
        .select("*")
        .gte("date", startStr)
        .lte("date", endStr)
    ]);
    
    return {
      schedule: (scheduleResponse.data as any[]) || [],
      events: (eventsResponse.data as any[]) || [],
    };

  } catch (error) {
    console.error("Critical error in getWeekSchedule:", error);
    return { schedule: [], events: [] };
  }
}

export async function getWeekSchedule(dateParam?: Date | null): Promise<WeekData> {
  let targetDate: Date;

  if (dateParam) {
    targetDate = dateParam;
  } else {
    const now = getNow();
    const dayOfWeek = getDay(now);

    // Логика воскресенья (0 = Воскресенье)
    if (dayOfWeek === 0) {
      console.log(`\x1b[36m📆 [LOGIC] Сегодня воскресенье (Минск), переключаем на след. неделю \x1b[0m`);
      targetDate = addWeeks(now, 1);
    } else {
      targetDate = now;
    }
  }
  
  const start = startOfWeek(targetDate, { weekStartsOn: 1 });
  const end = endOfWeek(targetDate, { weekStartsOn: 1 });
  
  const startStr = format(start, "yyyy-MM-dd");
  const endStr = format(end, "yyyy-MM-dd");

  // Обертка кэширования
  const getCachedData = unstable_cache(
    async () => fetchWeekSchedule(startStr, endStr),
    ['week-schedule', startStr, endStr], // Уникальный ключ кэша
    { revalidate: false, tags: ['schedule'] } // Живет 1 час
  );

  // Вызов
  const data = await getCachedData();

  return {
    schedule: data.schedule,
    events: data.events,
    weekStart: start,
  };
}