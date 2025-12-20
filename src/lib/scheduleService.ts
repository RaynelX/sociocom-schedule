import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { startOfWeek, endOfWeek, format, addWeeks, getDay, addDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { getNowMinsk } from "./date-utils";

// --- TYPES ---

export type LessonType = 'lecture' | 'seminar' | 'lab' | 'other' | string;

export interface ScheduleDetail {
  id: string;
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
  weekStart: string;
}

// --- CLIENT (Singleton Scope) ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: { persistSession: false } 
  }
);

// --- HELPERS ---

function safeParseDetails(json: any): ScheduleDetail[] {
  if (!Array.isArray(json)) {
    return [{ id: crypto.randomUUID(), subgroup: '', room: '', teacher: '' }];
  }
  
  return json.map((item: any) => ({
    id: item.id?.toString() || crypto.randomUUID(),
    subgroup: item.subgroup || '',
    teacher: item.teacher || '',
    room: item.room || '',
  }));
}

// --- DATA FETCHING ---

export const getBells = unstable_cache(
  async () => {
    const { data } = await supabase.from('bell_schedule').select('*').order('pair_number');
    return data || [];
  },
  ['bell-schedule'],
  { revalidate: false, tags: ['schedule'] }
);

async function fetchWeekScheduleInternal(startStr: string, endStr: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`\x1b[31m🔥 [DB HIT] Fetching: ${startStr} -> ${endStr} \x1b[0m`);
  }

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

    const rawSchedule = scheduleResponse.data || [];
    const schedule: ScheduleItem[] = rawSchedule.map((item: any) => ({
      ...item,
      details: safeParseDetails(item.details)
    }));

    return {
      schedule,
      events: (eventsResponse.data as EventItem[]) || [],
    };
  } catch (error) {
    console.error("Critical Schedule Fetch Error:", error);
    return { schedule: [], events: [] };
  }
}

/**
 * Получает расписание.
 * @param dateParam Опциональная дата. Если нет - вычисляется текущая учебная неделя.
 */
export async function getWeekSchedule(dateParam?: Date | null): Promise<WeekData> {
  let targetDate: Date;
  
  if (dateParam) {
    targetDate = dateParam;
  } else {
    targetDate = getNowMinsk();
  }
  
  const start = startOfWeek(targetDate, { weekStartsOn: 1 });
  const end = endOfWeek(targetDate, { weekStartsOn: 1 });
  
  const startStr = format(start, "yyyy-MM-dd");
  const endStr = format(end, "yyyy-MM-dd");

  const getCachedData = unstable_cache(
    async () => fetchWeekScheduleInternal(startStr, endStr),
    ['week-schedule', startStr, endStr], 
    { 
      revalidate: false, 
      tags: ['schedule'] 
    }
  );

  const data = await getCachedData();

  return { 
    schedule: data.schedule, 
    events: data.events, 
    weekStart: start.toISOString()
  };
}