import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { startOfWeek, endOfWeek, format, addWeeks, getDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

// --- TYPES ---

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

// --- CLIENT ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- HELPERS ---

export function getNow(): Date {
  const nowUtc = new Date();
  return toZonedTime(nowUtc, 'Europe/Minsk');
}

// Валидатор JSONB поля details
function safeParseDetails(json: any): ScheduleDetail[] {
  if (!Array.isArray(json)) {
    // Если пришел null или не массив, возвращаем дефолт
    return [{ subgroup: '', room: '', teacher: '' }];
  }
  // Маппим и гарантируем, что поля - строки
  return json.map((item: any) => ({
    id: item.id || Math.random(), // fallback id
    subgroup: typeof item.subgroup === 'string' ? item.subgroup : '',
    teacher: typeof item.teacher === 'string' ? item.teacher : '',
    room: typeof item.room === 'string' ? item.room : '',
  }));
}

// Получение звонков (Кэш навсегда)
export const getBells = unstable_cache(
  async () => {
    const { data } = await supabase.from('bell_schedule').select('*').order('pair_number');
    return data || [];
  },
  ['bell-schedule'],
  { revalidate: false, tags: ['schedule'] }
);

// Внутренняя функция запроса
async function fetchWeekSchedule(startStr:string, endStr:string) {
  console.log(`\x1b[31m🔥 [DB HIT] ГЛАВНАЯ: ${startStr} - ${endStr} \x1b[0m`);
  try {
    const [scheduleResponse, eventsResponse] = await Promise.all([
      supabase.from("schedule_items").select("*").lte("start_date", endStr).gte("end_date", startStr),  
      supabase.from("events").select("*").gte("date", startStr).lte("date", endStr)
    ]);
    
    // ПРИМЕНЯЕМ ВАЛИДАЦИЮ ТУТ
    const rawSchedule = (scheduleResponse.data as any[]) || [];
    const schedule: ScheduleItem[] = rawSchedule.map(item => ({
      ...item,
      details: safeParseDetails(item.details) // Парсим JSONB безопасно
    }));

    return {
      schedule: schedule,
      events: (eventsResponse.data as EventItem[]) || [],
    };
  } catch (error) {
    console.error("Error:", error);
    return { schedule: [], events: [] };
  }
}

// Публичная функция
export async function getWeekSchedule(dateParam?: Date | null): Promise<WeekData> {
  let targetDate: Date;
  if (dateParam) {
    targetDate = dateParam;
  } else {
    const now = getNow();
    const dayOfWeek = getDay(now);
    if (dayOfWeek === 0) targetDate = addWeeks(now, 1);
    else targetDate = now;
  }
  
  const start = startOfWeek(targetDate, { weekStartsOn: 1 });
  const end = endOfWeek(targetDate, { weekStartsOn: 1 });
  
  const startStr = format(start, "yyyy-MM-dd");
  const endStr = format(end, "yyyy-MM-dd");

  const getCachedData = unstable_cache(
    async () => fetchWeekSchedule(startStr, endStr),
    ['week-schedule', startStr, endStr],
    { revalidate: false, tags: ['schedule'] }
  );

  const data = await getCachedData();

  return { schedule: data.schedule, events: data.events, weekStart: start };
}