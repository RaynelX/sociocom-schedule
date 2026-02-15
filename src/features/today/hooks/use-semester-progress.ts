import { useMemo } from 'react';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import {
  getWeekNumber,
  getWeekParity,
} from '../../schedule/utils/week-utils';

export interface SemesterProgress {
  name: string;
  weekNumber: number;
  weekParity: 'odd' | 'even';
  parityLabel: string;
  progressPercent: number;
  daysLeft: number;
  loading: boolean;
}

export function useSemesterProgress(): SemesterProgress {
  const db = useDatabase();
  const { data: semesterData, loading } = useRxCollection(db.semester);

  return useMemo(() => {
    const config = semesterData[0] ?? null;

    if (loading || !config) {
      return {
        name: '',
        weekNumber: 0,
        weekParity: 'odd' as const,
        parityLabel: '',
        progressPercent: 0,
        daysLeft: 0,
        loading: true,
      };
    }

    const today = new Date();
    const start = new Date(config.start_date);
    const end = new Date(config.end_date);

    const totalMs = end.getTime() - start.getTime();
    const elapsedMs = today.getTime() - start.getTime();
    const progressPercent = Math.min(
      100,
      Math.max(0, Math.round((elapsedMs / totalMs) * 100)),
    );

    const daysLeft = Math.max(
      0,
      Math.ceil((end.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)),
    );

    const weekNumber = getWeekNumber(today, config.start_date);
    const weekParity = getWeekParity(today, config.odd_week_start);
    const parityLabel = weekParity === 'odd' ? 'нечётная' : 'чётная';

    return {
      name: config.name,
      weekNumber,
      weekParity,
      parityLabel,
      progressPercent,
      daysLeft,
      loading: false,
    };
  }, [loading, semesterData]);
}