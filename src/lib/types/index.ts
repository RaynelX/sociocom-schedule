// lib/types/index.ts

export type SubgroupDetail = {
    subgroup: string;
    room: string;
    teacher: string;
  };
  
  // bell_schedule
  export interface BellSchedule {
    pair_number: number; // 1
    start_time: string;  // "08:30"
    end_time: string;    // "09:50"
  }
  
  // subjects
  export interface Subject {
    id: number;       // 1
    name: string;     // "Философия"
    // created_at обычно не нужен
  }
  
  // schedule_items
  export interface ScheduleItem {
    id: number;                       // 1
    subject_id: number | null;        // Ссылка на Subject (в твоем описании поле называется 'subject', но обычно это FK)
    subject: string;                  // "Философия"
    day_of_week: number;              // 1 = Понедельник
    pair_number: number;              // 1
    start_date: string;               // ISO Date "2025-09-01"
    end_date: string;                 // ISO Date "2025-12-31"
    type: string;                     // "Лекция", "Семинар"
    details: SubgroupDetail[] | null; // JSONB
  }
  
  // events
  export interface CalendarEvent {
    id: number;
    title: string;                                  // "Контрольная работа по теории вероятностей"
    description: string | null;
    date: string;                                   // "2025-12-25"
    pair_number: number | null;                     // Если null, то событие на весь день
    subject: string | null;                         // Ссылка на предмет, если есть
    type: string;                                   // Типы событий
    room: string | null;
  }
  
  // Объединенный тип для UI (Пара + наложенное событие)
  export interface Lesson extends ScheduleItem {
    subjectName?: string; // Подтянутое имя предмета
    event?: CalendarEvent; // Если есть событие на эту пару
    isTransformed?: boolean; // Флаг, что пара изменена событием
  }