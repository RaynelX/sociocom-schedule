import type { RxJsonSchema } from 'rxdb';
import type {
  SubjectDoc,
  TeacherDoc,
  ScheduleEntryDoc,
  ScheduleOverrideDoc,
  EventDoc,
  StudentDoc,
  SemesterConfigDoc,
} from './types';

// ============================================================
// SUBJECTS
// ============================================================

const subjectsSchema: RxJsonSchema<SubjectDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    name: { type: 'string' },
    short_name: { type: 'string' },
    sdo_url: { type: 'string' },
    additional_links: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          url: { type: 'string' },
        },
      },
    },
    notes: { type: 'string' },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    is_deleted: { type: 'boolean' },
  },
  required: ['id', 'name', 'created_at', 'updated_at', 'is_deleted'],
};

// ============================================================
// TEACHERS
// ============================================================

const teachersSchema: RxJsonSchema<TeacherDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    full_name: { type: 'string' },
    position: { type: 'string' },
    email: { type: 'string' },
    phone: { type: 'string' },
    telegram: { type: 'string' },
    preferred_contact: { type: 'string' },
    consultation_info: { type: 'string' },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    is_deleted: { type: 'boolean' },
  },
  required: ['id', 'full_name', 'created_at', 'updated_at', 'is_deleted'],
};

// ============================================================
// SCHEDULE (schedule_entries в Supabase)
// ============================================================

const scheduleSchema: RxJsonSchema<ScheduleEntryDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    day_of_week: { type: 'integer', minimum: 1, maximum: 6 },
    pair_number: { type: 'integer', minimum: 1, maximum: 5 },
    subject_id: { type: 'string' },
    entry_type: {
      type: 'string',
      enum: ['lecture', 'seminar', 'practice', 'other'],
    },
    teacher_id: { type: 'string' },
    room: { type: 'string' },
    target_subgroup: {
      type: 'string',
      enum: ['all', 'a', 'b'],
    },
    target_language: {
      type: 'string',
      enum: ['all', 'en', 'de'],
    },
    date_from: { type: 'string' },
    date_to: { type: 'string' },
    week_parity: {
      type: 'string',
      enum: ['all', 'odd', 'even'],
    },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    is_deleted: { type: 'boolean' },
  },
  required: [
    'id', 'day_of_week', 'pair_number', 'subject_id', 'entry_type',
    'teacher_id', 'room', 'target_subgroup', 'target_language',
    'date_from', 'date_to', 'week_parity',
    'created_at', 'updated_at', 'is_deleted',
  ],
};

// ============================================================
// OVERRIDES (schedule_overrides в Supabase)
// ============================================================

const overridesSchema: RxJsonSchema<ScheduleOverrideDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    date: { type: 'string' },
    pair_number: { type: 'integer', minimum: 1, maximum: 5 },
    override_type: {
      type: 'string',
      enum: ['cancel', 'replace', 'add'],
    },
    target_subgroup: {
      type: 'string',
      enum: ['all', 'a', 'b'],
    },
    target_language: {
      type: 'string',
      enum: ['all', 'en', 'de'],
    },
    subject_id: { type: 'string' },
    entry_type: {
      type: 'string',
      enum: ['lecture', 'seminar', 'practice', 'other'],
    },
    teacher_id: { type: 'string' },
    room: { type: 'string' },
    comment: { type: 'string' },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    is_deleted: { type: 'boolean' },
  },
  required: [
    'id', 'date', 'pair_number', 'override_type',
    'target_subgroup', 'target_language',
    'created_at', 'updated_at', 'is_deleted',
  ],
};

// ============================================================
// EVENTS
// ============================================================

const eventsSchema: RxJsonSchema<EventDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    title: { type: 'string' },
    description: { type: 'string' },
    event_type: {
      type: 'string',
      enum: [
        'usr', 'deadline', 'control_work',
        'credit', 'exam', 'consultation', 'other',
      ],
    },
    subject_id: { type: 'string' },
    teacher_id: { type: 'string' },
    date: { type: 'string' },
    pair_number: { type: 'integer', minimum: 1, maximum: 5 },
    event_time: { type: 'string' },
    room: { type: 'string' },
    target_subgroup: {
      type: 'string',
      enum: ['all', 'a', 'b'],
    },
    target_language: {
      type: 'string',
      enum: ['all', 'en', 'de'],
    },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    is_deleted: { type: 'boolean' },
  },
  required: [
    'id', 'title', 'event_type', 'date',
    'target_subgroup', 'target_language',
    'created_at', 'updated_at', 'is_deleted',
  ],
};

// ============================================================
// STUDENTS
// ============================================================

const studentsSchema: RxJsonSchema<StudentDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    full_name: { type: 'string' },
    subgroup: {
      type: 'string',
      enum: ['a', 'b'],
    },
    language: {
      type: 'string',
      enum: ['en', 'de'],
    },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    is_deleted: { type: 'boolean' },
  },
  required: ['id', 'full_name', 'subgroup', 'language', 'created_at', 'updated_at', 'is_deleted'],
};

// ============================================================
// SEMESTER (semester_config в Supabase)
// ============================================================

const semesterSchema: RxJsonSchema<SemesterConfigDoc> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 36 },
    name: { type: 'string' },
    start_date: { type: 'string' },
    end_date: { type: 'string' },
    odd_week_start: { type: 'string' },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
  },
  required: ['id', 'name', 'start_date', 'end_date', 'odd_week_start', 'created_at', 'updated_at'],
};

// ============================================================
// ЭКСПОРТ
// ============================================================

export const schemas = {
  subjects: subjectsSchema,
  teachers: teachersSchema,
  schedule: scheduleSchema,
  overrides: overridesSchema,
  events: eventsSchema,
  students: studentsSchema,
  semester: semesterSchema,
};