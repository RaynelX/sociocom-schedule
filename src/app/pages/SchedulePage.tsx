import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDaySchedule } from '../../features/schedule/hooks/use-day-schedule';
import { DaySchedule } from '../../features/schedule/components/DaySchedule';
import {
  getMonday,
  addDays,
  getDayOfWeek,
  isToday,
  formatWeekRange,
  getWeekNumber,
} from '../../features/schedule/utils/week-utils';
import { useDatabase } from '../providers/DatabaseProvider';
import { useRxCollection } from '../../database/hooks/use-rx-collection';
import { DAY_NAMES_SHORT } from '../../shared/constants/days';
import { useSetPageHeader } from '../providers/PageHeaderProvider';

// ============================================================
// Компонент страницы
// ============================================================

export function SchedulePage() {
  const db = useDatabase();
  const { data: semesterData } = useRxCollection(db.semester);
  const semesterConfig = semesterData[0] ?? null;

  // Если сегодня воскресенье — по умолчанию показываем понедельник следующей недели
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    return getDayOfWeek(today) === 7 ? addDays(today, 1) : today;
  });

  const monday = getMonday(selectedDate);
  const weekRange = formatWeekRange(monday);
  const weekNumber = semesterConfig
    ? getWeekNumber(selectedDate, semesterConfig.start_date)
    : null;

  const { schedule, loading } = useDaySchedule(selectedDate);

  // Навигация по неделям
  const goToPrevWeek = () => setSelectedDate((d) => addDays(d, -7));
  const goToNextWeek = () => setSelectedDate((d) => addDays(d, 7));
  const goToDay = (dayOffset: number) => setSelectedDate(addDays(monday, dayOffset));

  useSetPageHeader({title: 'Расписание'});

  return (
    <div className="flex flex-col h-full">
      {/* Навигация по неделям */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800">
        <button
          onClick={goToPrevWeek}
          className="p-2.5 -m-1 rounded-xl text-gray-500 dark:text-neutral-400 active:bg-gray-100 dark:active:bg-neutral-800"
        >
          <ChevronLeft size={22} />
        </button>

        <div className="text-center">
          <p className="text-base font-semibold text-gray-900 dark:text-neutral-100">{weekRange}</p>
          {weekNumber !== null && weekNumber > 0 && (
            <p className="text-xs text-gray-500 dark:text-neutral-400">{weekNumber}-я неделя</p>
          )}
        </div>

        <button
          onClick={goToNextWeek}
          className="p-2.5 -m-1 rounded-xl text-gray-500 dark:text-neutral-400 active:bg-gray-100 dark:active:bg-neutral-800"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Табы дней */}
      <div className="shrink-0 flex bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800 px-1">
        {[0, 1, 2, 3, 4, 5].map((offset) => {
          const date = addDays(monday, offset);
          const dayNum = offset + 1;
          const isSelected =
            getDayOfWeek(selectedDate) === dayNum &&
            getMonday(selectedDate).getTime() === monday.getTime();
          const isTodayDate = isToday(date);

          return (
            <button
              key={offset}
              onClick={() => goToDay(offset)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                isSelected
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-neutral-400 active:text-gray-700'
              }`}
            >
              <span className="text-xs font-medium">
                {DAY_NAMES_SHORT[dayNum]}
              </span>
              <span
                className={`text-sm w-8 h-8 flex items-center justify-center rounded-full font-medium ${
                  isSelected
                    ? 'bg-blue-600 text-white dark:bg-blue-500'
                    : isTodayDate
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                      : ''
                }`}
              >
                {date.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Содержимое дня */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-gray-500 dark:text-neutral-400">Загрузка...</p>
          </div>
        ) : (
          <DaySchedule
            slots={schedule.slots}
            floatingEvents={schedule.floatingEvents}
            date={selectedDate}
          />
        )}
      </div>
    </div>
  );
}