import { useMemo } from 'react';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { useSettings } from '../../settings/SettingsProvider';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import { toISODate, addDays } from '../../schedule/utils/week-utils';

export interface UpcomingEventGroup {
  date: string;
  label: string;
  events: UpcomingEvent[];
}

export interface UpcomingEvent {
  id: string;
  eventType: string;
  subjectName?: string;
  description?: string;
  room?: string;
  pairLabel: string;
}

const DAYS_AHEAD = 14;

export function useUpcomingEvents(): {
  groups: UpcomingEventGroup[];
  loading: boolean;
} {
  const db = useDatabase();
  const { settings } = useSettings();

  const { data: events, loading: l1 } = useRxCollection(db.events);
  const { data: subjects, loading: l2 } = useRxCollection(db.subjects);

  const loading = l1 || l2;

  return useMemo(() => {
    if (loading) return { groups: [], loading: true };

    const today = new Date();
    const todayStr = toISODate(today);
    const endStr = toISODate(addDays(today, DAYS_AHEAD));
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));

    // Фильтрация
    const filtered = events.filter((e) => {
      if (e.date < todayStr || e.date > endStr) return false;

      const subOk = e.target_subgroup === 'all' || e.target_subgroup === settings.subgroup;
      const langOk = e.target_language === 'all' || e.target_language === settings.language;
      return subOk && langOk;
    });

    if (filtered.length === 0) return { groups: [], loading: false };

    // Сортировка по дате
    const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));

    // Группировка по дате
    const groupMap = new Map<string, UpcomingEvent[]>();
    for (const event of sorted) {
      const subject = event.subject_id ? subjectMap.get(event.subject_id) : undefined;

      const item: UpcomingEvent = {
        id: event.id,
        eventType: event.event_type,
        subjectName: subject?.name,
        description: event.description ?? undefined,
        room: event.room ?? undefined,
        pairLabel: event.pair_number
          ? `${event.pair_number} пара`
          : event.event_time
            ? event.event_time.slice(0, 5)
            : 'В течение дня',
      };

      const existing = groupMap.get(event.date);
      if (existing) {
        existing.push(item);
      } else {
        groupMap.set(event.date, [item]);
      }
    }

    // Формируем группы с лейблами
    const groups: UpcomingEventGroup[] = [];
    for (const [date, items] of groupMap) {
      groups.push({
        date,
        label: formatDateLabel(date, todayStr),
        events: items,
      });
    }

    return { groups, loading: false };
  }, [loading, events, subjects, settings]);
}

function formatDateLabel(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return 'Сегодня';

  const date = new Date(dateStr);
  const today = new Date(todayStr);
  const diffDays = Math.round(
    (date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (diffDays === 1) return 'Завтра';

  const formatter = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  });
  return formatter.format(date);
}