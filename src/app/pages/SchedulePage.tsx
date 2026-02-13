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

  return (
    <div className="flex flex-col h-full">
      {/* Навигация по неделям */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-100">
        <button
          onClick={goToPrevWeek}
          className="p-1.5 rounded-lg text-gray-400 active:bg-gray-100"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900">{weekRange}</p>
          {weekNumber !== null && weekNumber > 0 && (
            <p className="text-[11px] text-gray-400">{weekNumber}-я неделя</p>
          )}
        </div>

        <button
          onClick={goToNextWeek}
          className="p-1.5 rounded-lg text-gray-400 active:bg-gray-100"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Табы дней */}
      <div className="shrink-0 flex bg-white border-b border-gray-100 px-2">
        {[0, 1, 2, 3, 4, 5].map((offset) => {
          const date = addDays(monday, offset);
          const dayNum = offset + 1; // 1=Пн, ..., 6=Сб
          const isSelected =
            getDayOfWeek(selectedDate) === dayNum &&
            getMonday(selectedDate).getTime() === monday.getTime();
          const isTodayDate = isToday(date);

          return (
            <button
              key={offset}
              onClick={() => goToDay(offset)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors relative ${
                isSelected
                  ? 'text-blue-600'
                  : 'text-gray-400 active:text-gray-600'
              }`}
            >
              <span className="text-[11px] font-medium">
                {DAY_NAMES_SHORT[dayNum]}
              </span>
              <span
                className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : isTodayDate
                      ? 'bg-blue-100 text-blue-600'
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
            <p className="text-gray-400">Загрузка...</p>
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