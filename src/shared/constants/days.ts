export const DAY_NAMES: Record<number, string> = {
  1: 'Понедельник',
  2: 'Вторник',
  3: 'Среда',
  4: 'Четверг',
  5: 'Пятница',
  6: 'Суббота',
};

export const DAY_NAMES_SHORT: Record<number, string> = {
  1: 'Пн',
  2: 'Вт',
  3: 'Ср',
  4: 'Чт',
  5: 'Пт',
  6: 'Сб',
};

export function getDayOfWeek(date: Date): number {
  const jsDay = date.getDay(); // 0=Вс, 1=Пн, ..., 6=Сб
  return jsDay === 0 ? 7 : jsDay; // 1=Пн, ..., 6=Сб, 7=Вс
}