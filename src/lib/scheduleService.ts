import { supabase } from "./supabaseClient";
import { startOfWeek, endOfWeek, format } from "date-fns";

// --- TYPES ---

// Выносим типы занятий в отдельный тип для переиспользования и строгости
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

// --- SERVICE ---

/**
 * Получает расписание и события на неделю, к которой относится переданная дата.
 * Запросы выполняются параллельно.
 * 
 * Логика выборки расписания:
 * Ищем предметы, которые НАЧАЛИСЬ до конца этой недели И ЗАКОНЧАТСЯ после начала этой недели.
 * Это покрывает все пересечения интервалов.
 */

export async function getWeekSchedule(date: Date): Promise<WeekData> {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  
  const startStr = format(start, "yyyy-MM-dd");
  const endStr = format(end, "yyyy-MM-dd");

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

    if (scheduleResponse.error) {
      console.error("Schedule fetch error:", scheduleResponse.error.message);
    }
    
    if (eventsResponse.error) {
      console.error("Events fetch error:", eventsResponse.error.message);
    }

    return {
      schedule: (scheduleResponse.data as ScheduleItem[]) || [],
      events: (eventsResponse.data as EventItem[]) || [],
      weekStart: start,
    };

  } catch (error) {
    console.error("Critical error in getWeekSchedule:", error);
    return {
      schedule: [],
      events: [],
      weekStart: start,
    };
  }
}