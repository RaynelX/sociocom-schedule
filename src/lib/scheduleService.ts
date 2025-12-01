import { supabase } from "./supabaseClient";
import { startOfWeek, endOfWeek, format } from "date-fns";

// Детали
export type ScheduleDetail = {
  subgroup: string;
  teacher: string;
  room: string;
};

// Предмет
export type ScheduleItem = {
  id: number;
  subject: string;
  day_of_week: number;
  pair_number: number;
  type: string;
  start_date: string;
  end_date: string;
  details: ScheduleDetail[];
};

// Событие
export type EventItem = {
  id: number;
  title: string;
  date: string; 
  pair_number: number | null;
  type: string;
  subject: string | null;
};

export async function getWeekSchedule(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  const startStr = format(start, "yyyy-MM-dd");
  const endStr = format(end, "yyyy-MM-dd");

  const { data: scheduleData, error: scheduleError } = await supabase
    .from("schedule_items")
    .select("*")
    .lte("start_date", endStr)
    .gte("end_date", startStr);

  if (scheduleError) console.error("Error fetching schedule:", scheduleError);

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