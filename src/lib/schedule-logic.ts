import { 
    BellSchedule, 
    CalendarEvent, 
    ScheduleItem, 
    SubgroupDetail 
  } from "./types/index";
  import { format, isSameDay, parseISO } from "date-fns";
  
  // Тип для готовой к отображению карточки
  export interface RenderedLesson {
    id: string; // Уникальный ключ для React
    pairNumber: number;
    startTime: string;
    endTime: string;
    subjectName: string;
    type: string;       // "Лекция", "Экзамен"
    room: string | null;
    teacher: string | null;
    subgroups: SubgroupDetail[] | null;
    
    // Флаги состояния
    isCancelled: boolean;
    isEvent: boolean;   // Это событие (не регулярная пара)?
    eventColor?: string; // Для цветной полоски
  }
  
  export function getLessonsForDate(
    date: Date,
    scheduleItems: ScheduleItem[],
    events: CalendarEvent[],
    bellSchedule: BellSchedule[]
  ): RenderedLesson[] {
    const dateString = format(date, "yyyy-MM-dd");
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // JS: 0=Sun, мы хотим 7=Sun (или 1-6 пн-сб)
  
    // 1. Получаем регулярные пары на этот день недели
    const regularPairs = scheduleItems.filter((item) => {
      return (
        item.day_of_week === dayOfWeek &&
        dateString >= item.start_date &&
        dateString <= item.end_date
      );
    });
  
    // 2. Получаем события на эту КОНКРЕТНУЮ дату
    const daysEvents = events.filter((e) => e.date === dateString);
  
    // 3. Собираем карту занятых слотов (по номеру пары)
    // Мы берем все возможные номера пар из звонков или существующих пар
    const allPairNumbers = new Set([
      ...regularPairs.map(p => p.pair_number),
      ...daysEvents.map(e => e.pair_number).filter((n): n is number => n !== null)
    ]);
  
    const result: RenderedLesson[] = [];
  
    // 4. Проходимся по всем слотам и формируем итоговую картинку
    Array.from(allPairNumbers).sort((a, b) => a - b).forEach((pairNum) => {
      const pair = regularPairs.find(p => p.pair_number === pairNum);
      const event = daysEvents.find(e => e.pair_number === pairNum);
      const bells = bellSchedule.find(b => b.pair_number === pairNum);
  
      const startTime = bells ? bells.start_time.slice(0, 5) : "??:??";
      const endTime = bells ? bells.end_time.slice(0, 5) : "??:??";
  
      // Сценарий А: Есть событие, которое ПЕРЕКРЫВАЕТ пару (например, Отмена или Контрольная)
      if (event) {
        const isCancel = event.type === "cancel";
        
        // Если это отмена, мы показываем пару, но серую
        if (isCancel && pair) {
          result.push({
            id: `cancel-${pair.id}`,
            pairNumber: pairNum,
            startTime,
            endTime,
            subjectName: pair.subject,
            type: "Отмена",
            room: pair.details?.[0]?.room || null, // Берем первую попавшуюся
            teacher: null,
            subgroups: null,
            isCancelled: true,
            isEvent: true,
          });
          return;
        }
  
        // Если это событие (Экзамен, Зачет) - оно приоритетнее регулярной пары
        result.push({
          id: `event-${event.id}`,
          pairNumber: pairNum,
          startTime: event.event_time?.slice(0,5) || startTime, // Если у события свое время
          endTime,
          subjectName: event.subject || event.title, // Если предмета нет, показываем заголовок
          type: mapEventType(event.type),
          room: event.room || null,
          teacher: null,
          subgroups: null,
          isCancelled: false,
          isEvent: true,
          eventColor: getEventColor(event.type)
        });
        return;
      }
  
      // Сценарий Б: Обычная регулярная пара
      if (pair) {
        // Пытаемся вытащить аудиторию из первой подгруппы, если она одна
        const mainRoom = pair.details && pair.details.length === 1 ? pair.details[0].room : null;
        const mainTeacher = pair.details && pair.details.length === 1 ? pair.details[0].teacher : null;
  
        result.push({
          id: `pair-${pair.id}`,
          pairNumber: pairNum,
          startTime,
          endTime,
          subjectName: pair.subject,
          type: pair.type === "lecture" ? "Лекция" : pair.type === "seminar" ? "Семинар" : pair.type,
          room: mainRoom,
          teacher: mainTeacher,
          subgroups: pair.details && pair.details.length > 1 ? pair.details : null,
          isCancelled: false,
          isEvent: false,
        });
      }
    });
  
    return result;
  }
  
  // Хелперы для красок
  function mapEventType(type: string): string {
    const map: Record<string, string> = {
      deadline: "Дедлайн",
      control_work: "Контрольная",
      independent_work: "УСР",
      credit: "Зачёт",
      exam: "Экзамен",
      consultation: "Консультация",
      other: "Событие"
    };
    return map[type] || type;
  }
  
  function getEventColor(type: string): string {
    switch (type) {
      case "deadline": return "bg-red-500";
      case "exam": return "bg-purple-600";
      case "credit": return "bg-orange-500";
      case "cancel": return "bg-gray-400";
      default: return "bg-blue-500";
    }
  }