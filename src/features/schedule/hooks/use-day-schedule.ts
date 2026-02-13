import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { useSettings } from '../../settings/SettingsProvider';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import { buildDaySchedule, type DayEvents } from '../utils/schedule-builder';

export function useDaySchedule(date: Date): {
  schedule: DayEvents;
  loading: boolean;
} {
  const db = useDatabase();
  const { settings } = useSettings();

  const { data: entries, loading: l1 } = useRxCollection(db.schedule);
  const { data: overrides, loading: l2 } = useRxCollection(db.overrides);
  const { data: events, loading: l3 } = useRxCollection(db.events);
  const { data: subjects, loading: l4 } = useRxCollection(db.subjects);
  const { data: teachers, loading: l5 } = useRxCollection(db.teachers);
  const { data: semesterData, loading: l6 } = useRxCollection(db.semester);

  const loading = l1 || l2 || l3 || l4 || l5 || l6;

  if (loading) {
    return { schedule: { slots: [], floatingEvents: [] }, loading: true };
  }

  const schedule = buildDaySchedule({
    date,
    settings,
    entries,
    overrides,
    events,
    subjects,
    teachers,
    semesterConfig: semesterData[0] ?? null,
    excludeEventTypes: ['deadline'],
  });

  return { schedule, loading: false };
}