import { useMemo } from 'react';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { useSettings } from '../../settings/SettingsProvider';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import { toISODate, addDays } from '../../schedule/utils/week-utils';

export interface UpcomingEvent {
  id: string;
  eventType: string;
  subjectName?: string;
  description?: string;
  dateLabel: string;
  timeLabel: string;
}

const DAYS_AHEAD = 7;

export function useUpcomingEvents(): {
  events: UpcomingEvent[];
  loading: boolean;
} {
  const db = useDatabase();
  const { settings } = useSettings();

  const { data: events, loading: l1 } = useRxCollection(db.events);
  const { data: subjects, loading: l2 } = useRxCollection(db.subjects);

  const loading = l1 || l2;

  return useMemo(() => {
    if (loading) return { events: [], loading: true };

    const today = new Date();
    const todayStr = toISODate(today);
    const endStr = toISODate(addDays(today, DAYS_AHEAD));
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));

    const filtered = events.filter((e) => {
      if (e.date < todayStr || e.date > endStr) return false;
      const subOk = e.target_subgroup === 'all' || e.target_subgroup === settings.subgroup;
      const langOk = e.target_language === 'all' || e.target_language === settings.language;
      return subOk && langOk;
    });

    if (filtered.length === 0) return { events: [], loading: false };

    const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));

    const result: UpcomingEvent[] = sorted.map((event) => {
      const subject = event.subject_id ? subjectMap.get(event.subject_id) : undefined;

      return {
        id: event.id,
        eventType: event.event_type,
        subjectName: subject?.short_name ?? subject?.name,
        description: event.description ?? undefined,
        dateLabel: formatShortDate(event.date, todayStr),
        timeLabel: event.pair_number
          ? `${event.pair_number} пара`
          : event.event_time
            ? event.event_time.slice(0, 5)
            : '',
      };
    });

    return { events: result, loading: false };
  }, [loading, events, subjects, settings]);
}

function formatShortDate(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return 'Сегодня';

  const date = new Date(dateStr);
  const today = new Date(todayStr);
  const diffDays = Math.round(
    (date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (diffDays === 1) return 'Завтра';

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}