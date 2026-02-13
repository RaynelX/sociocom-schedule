/**
 * Возвращает день недели: 1=Пн, 2=Вт, ..., 6=Сб, 7=Вс
 */
export function getDayOfWeek(date: Date): number {
    const jsDay = date.getDay(); // 0=Вс, 1=Пн, ..., 6=Сб
    return jsDay === 0 ? 7 : jsDay;
  }
  
  /**
   * Возвращает дату понедельника для недели, содержащей указанную дату.
   */
  export function getMonday(date: Date): Date {
    const d = stripTime(date);
    const day = getDayOfWeek(d);
    d.setDate(d.getDate() - (day - 1));
    return d;
  }
  
  /**
   * Добавляет указанное количество дней к дате.
   */
  export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  
  /**
   * Сбрасывает время до 00:00:00.000 (локальное время).
   */
  export function stripTime(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  
  /**
   * Сравнивает две даты без учёта времени.
   */
  export function isSameDay(a: Date, b: Date): boolean {
    return toISODate(a) === toISODate(b);
  }
  
  /**
   * Проверяет, является ли дата сегодняшней.
   */
  export function isToday(date: Date): boolean {
    return isSameDay(date, new Date());
  }
  
  /**
   * Форматирует дату в ISO-формат: "2026-02-09"
   */
  export function toISODate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  
  /**
   * Определяет чётность недели.
   * oddWeekStart — дата понедельника первой нечётной недели семестра.
   */
  export function getWeekParity(
    date: Date,
    oddWeekStart: string,
  ): 'odd' | 'even' {
    const monday = getMonday(date);
    const startMonday = getMonday(new Date(oddWeekStart));
    const diffMs = monday.getTime() - startMonday.getTime();
    const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
    return diffWeeks % 2 === 0 ? 'odd' : 'even';
  }
  
  /**
   * Форматирует диапазон недели: "10 – 15 фев." или "28 янв. – 2 фев."
   */
  export function formatWeekRange(monday: Date): string {
    const saturday = addDays(monday, 5);
  
    const monDay = monday.getDate();
    const satDay = saturday.getDate();
  
    const monthFormatter = new Intl.DateTimeFormat('ru-RU', { month: 'short' });
    const monMonth = monthFormatter.format(monday);
    const satMonth = monthFormatter.format(saturday);
  
    if (monMonth === satMonth) {
      return `${monDay} – ${satDay} ${satMonth}`;
    }
    return `${monDay} ${monMonth} – ${satDay} ${satMonth}`;
  }
  
  /**
   * Определяет номер учебной недели.
   */
  export function getWeekNumber(date: Date, semesterStart: string): number {
    const monday = getMonday(date);
    const startMonday = getMonday(new Date(semesterStart));
    const diffMs = monday.getTime() - startMonday.getTime();
    return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
  }
  
  /**
   * Проверяет, идёт ли сейчас указанная пара (для подсветки текущей пары).
   */
  export function isCurrentPair(
    date: Date,
    startTime: string,
    endTime: string,
  ): boolean {
    const now = new Date();
    if (!isSameDay(date, now)) return false;
  
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
  
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
  
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }