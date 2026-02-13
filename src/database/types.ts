import type { RxCollection, RxDatabase } from 'rxdb';

// ============================================================
// Перечисления
// ============================================================

export type EntryType = 'lecture' | 'seminar' | 'practice' | 'other';
export type TargetSubgroup = 'all' | 'a' | 'b';
export type TargetLanguage = 'all' | 'en' | 'de';
export type WeekParity = 'all' | 'odd' | 'even';
export type OverrideType = 'cancel' | 'replace' | 'add';
export type EventType =
  | 'usr'
  | 'deadline'
  | 'control_work'
  | 'credit'
  | 'exam'
  | 'consultation'
  | 'other';

// ============================================================
// Документы (типы записей в RxDB)
// ============================================================

export interface SubjectDoc {
  id: string;
  name: string;
  short_name?: string;
  sdo_url?: string;
  additional_links?: AdditionalLink[];
  notes?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface AdditionalLink {
  label: string;
  url: string;
}

export interface TeacherDoc {
  id: string;
  full_name: string;
  position?: string;
  email?: string;
  phone?: string;
  telegram?: string;
  preferred_contact?: string;
  consultation_info?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface ScheduleEntryDoc {
  id: string;
  day_of_week: number;
  pair_number: number;
  subject_id: string;
  entry_type: EntryType;
  teacher_id: string;
  room: string;
  target_subgroup: TargetSubgroup;
  target_language: TargetLanguage;
  date_from: string;
  date_to: string;
  week_parity: WeekParity;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface ScheduleOverrideDoc {
  id: string;
  date: string;
  pair_number: number;
  override_type: OverrideType;
  target_subgroup: TargetSubgroup;
  target_language: TargetLanguage;
  subject_id?: string;
  entry_type?: EntryType;
  teacher_id?: string;
  room?: string;
  comment?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface EventDoc {
  id: string;
  title: string;
  description?: string;
  event_type: EventType;
  subject_id?: string;
  teacher_id?: string;
  date: string;
  pair_number?: number;
  event_time?: string;
  room?: string;
  target_subgroup: TargetSubgroup;
  target_language: TargetLanguage;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface StudentDoc {
  id: string;
  full_name: string;
  subgroup: 'a' | 'b';
  language: 'en' | 'de';
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface SemesterConfigDoc {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  odd_week_start: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Типы базы данных
// ============================================================

export type DatabaseCollections = {
  subjects: RxCollection<SubjectDoc>;
  teachers: RxCollection<TeacherDoc>;
  schedule: RxCollection<ScheduleEntryDoc>;
  overrides: RxCollection<ScheduleOverrideDoc>;
  events: RxCollection<EventDoc>;
  students: RxCollection<StudentDoc>;
  semester: RxCollection<SemesterConfigDoc>;
};

export type AppDatabase = RxDatabase<DatabaseCollections>;

// ============================================================
// Настройки студента (хранятся в localStorage)
// ============================================================

export interface StudentSettings {
  studentId?: string;
  subgroup: 'a' | 'b';
  language: 'en' | 'de';
}