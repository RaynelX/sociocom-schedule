import { supabase } from "./supabaseClient";
import { startOfWeek, endOfWeek, format } from "date-fns";

// Типы данных (чтобы TypeScript не ругался)
export type ScheduleItem = {
  id: number;
  subject: string;
  teacher: string | null;
  room: string | null;
  day_of_week: number;
  pair_number: number;
  type: string;
  start_date: string;
  end_date: string;
  subgroup: string | null;
};

export type EventItem = {
  id: number;
  title: string;
  date: string; // ISO string YYYY-MM-DD
  pair_number: number | null;
  type: string;
  subject: string
};

export async function getWeekSchedule(date: Date) {
  // 1. Вычисляем начало и конец текущей недели (Понедельник - Воскресенье)
  // weekStartsOn: 1 означает, что неделя начинается с Понедельника
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });

  const startStr = format(start, "yyyy-MM-dd");
  const endStr = format(end, "yyyy-MM-dd");

  // 2. Запрос расписания (Повторяющиеся пары)
  // Логика: (start_date <= конец_недели) И (end_date >= начало_недели)
  const { data: scheduleData, error: scheduleError } = await supabase
    .from("schedule_items")
    .select("*")
    .lte("start_date", endStr)
    .gte("end_date", startStr);

  if (scheduleError) console.error("Error fetching schedule:", scheduleError);

  // 3. Запрос событий (Разовые: КР, отмены и т.д.)
  const { data: eventsData, error: eventsError } = await supabase
    .from("events")
    .select("*")
    .gte("date", startStr)
    .lte("date", endStr);

  if (eventsError) console.error("Error fetching events:", eventsError);

  return {
    schedule: scheduleData as ScheduleItem[] || [],
    events: eventsData as EventItem[] || [],
    weekStart: start,
  };
}