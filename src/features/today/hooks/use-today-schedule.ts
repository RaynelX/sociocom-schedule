import { useMemo } from 'react';
import { useDatabase } from '../../../app/providers/DatabaseProvider';
import { useSettings } from '../../settings/SettingsProvider';
import { useRxCollection } from '../../../database/hooks/use-rx-collection';
import { buildDaySchedule } from '../../schedule/utils/schedule-builder';
import {
  getDayOfWeek,
  addDays,
} from '../../schedule/utils/week-utils';
import type { DaySlot } from '../../schedule/utils/schedule-builder';

export interface CurrentPairInfo {
  slot: DaySlot;
  elapsedMinutes: number;
  totalMinutes: number;
  remainingMinutes: number;
  progressPercent: number;
  nextPair: DaySlot | null;
  breakMinutes: number | null;
}

export interface TodayScheduleData {
  todayPairs: DaySlot[];
  allPairsFinished: boolean;
  hasPairsToday: boolean;
  nextDay: {
    date: Date;
    dayName: string;
    pairCount: number;
    firstPairTime: string;
    pairs: DaySlot[];
  } | null;
  loading: boolean;
}

export function useTodaySchedule(): TodayScheduleData {
  const db = useDatabase();
  const { settings } = useSettings();

  const { data: entries, loading: l1 } = useRxCollection(db.schedule);
  const { data: overrides, loading: l2 } = useRxCollection(db.overrides);
  const { data: events, loading: l3 } = useRxCollection(db.events);
  const { data: subjects, loading: l4 } = useRxCollection(db.subjects);
  const { data: teachers, loading: l5 } = useRxCollection(db.teachers);
  const { data: semesterData, loading: l6 } = useRxCollection(db.semester);

  const loading = l1 || l2 || l3 || l4 || l5 || l6;
  const semesterConfig = semesterData[0] ?? null;

  return useMemo(() => {
    if (loading) {
      return {
        todayPairs: [],
        allPairsFinished: false,
        hasPairsToday: false,
        currentPair: null,
        nextDay: null,
        loading: true,
      };
    }

    const today = new Date();
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const buildParams = {
      settings,
      entries,
      overrides,
      events,
      subjects,
      teachers,
      semesterConfig,
      excludeEventTypes: [] as any,
    };

    // Сегодняшние пары
    const todayResult = buildDaySchedule({ ...buildParams, date: today });
    const todayPairs = todayResult.slots.filter((s) => s.pair !== null);
    const hasPairsToday = todayPairs.length > 0;

    // Все пары закончились?
    let allPairsFinished = false;
    if (hasPairsToday) {
      const lastPair = todayPairs[todayPairs.length - 1];
      const [eh, em] = lastPair.endTime.split(':').map(Number);
      allPairsFinished = currentMinutes > eh * 60 + em;
    }

    // Следующий учебный день
    let nextDay: TodayScheduleData['nextDay'] = null;
    if (!hasPairsToday || allPairsFinished) {
      const dayNames = ['', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

      for (let offset = 1; offset <= 7; offset++) {
        const candidate = addDays(today, offset);
        const candidateResult = buildDaySchedule({ ...buildParams, date: candidate });
        const candidatePairs = candidateResult.slots.filter((s) => s.pair !== null);

        if (candidatePairs.length > 0) {
          nextDay = {
            date: candidate,
            dayName: dayNames[getDayOfWeek(candidate)],
            pairCount: candidatePairs.length,
            firstPairTime: candidatePairs[0].startTime,
            pairs: candidatePairs,
          };
          break;
        }
      }
    }

    return {
      todayPairs,
      allPairsFinished,
      hasPairsToday,
      nextDay,
      loading: false,
    };
  }, [loading, settings, entries, overrides, events, subjects, teachers, semesterConfig]);
}