// lib/date-utils.ts
import { toZonedTime } from "date-fns-tz";
import { getDay, addWeeks, startOfWeek, format } from "date-fns";

const TIMEZONE = 'Europe/Minsk';

export const getNowMinsk = () => toZonedTime(new Date(), TIMEZONE);

/**
 * Возвращает дату, которую нужно показать пользователю по умолчанию.
 * Если сегодня воскресенье -> возвращает дату следующей недели.
 * Если любой другой день -> возвращает текущую дату.
 */
export const getInitialTargetDate = (): Date => {
  const now = getNowMinsk();
  const dayOfWeek = getDay(now); // 0 = Воскресенье

  if (dayOfWeek === 0) {
    // Если воскресенье, прыгаем на неделю вперед
    return addWeeks(now, 1);
  }
  
  return now;
};

/**
 * Форматирует дату для URL и запросов
 */
export const formatDateKey = (date: Date) => format(date, 'yyyy-MM-dd');