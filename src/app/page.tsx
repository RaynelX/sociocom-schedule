import { getWeekSchedule } from "@/lib/scheduleService";
import { format, addDays, isSameDay, parseISO, addWeeks, subWeeks } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// === КОНФИГ СТИЛЕЙ ===
// 1. Стили для ТИПОВ ЗАНЯТИЙ (Лекция, Семинар...)
const LESSON_TYPES: Record<string, string> = {
  lecture: 'Лекция',
  seminar: 'Семинар',
  lab: 'Практика',
  other: 'Другое'
};

const LESSON_BADGES: Record<string, string> = {
  lecture: 'border-green-200 text-green-700 bg-green-50',
  seminar: 'border-blue-200 text-blue-700 bg-blue-50',
  lab: 'border-orange-200 text-orange-700 bg-orange-50',
  other: 'border-gray-200 text-gray-700 bg-gray-50'
};

// 2. Стили для СОБЫТИЙ (КР, Зачет...)
// border = цвет полоски слева, bg = цвет фона карточки, text = цвет заголовка события
const EVENT_STYLES: Record<string, { label: string; border: string; bg: string; text: string }> = {
  control_work: { label: 'Контрольная работа', border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-700' },
  independent_work: { label: 'УСР', border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
  credit: { label: 'Зачёт', border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-800' },
  exam: { label: 'Экзамен', border: 'border-purple-600', bg: 'bg-purple-50', text: 'text-purple-800' },
  consultation: { label: 'Консультация', border: 'border-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-800' },
  cancel: { label: 'Отмена занятия', border: 'border-gray-400', bg: 'bg-gray-100', text: 'text-gray-500' },
  deadline: { label: 'Дедлайн', border: 'border-orange-400', bg: 'bg-orange-50', text: 'text-orange-900' },
};

export default async function Home(props: Props) {
  const searchParams = await props.searchParams;
  const dateParam = typeof searchParams.date === 'string' ? searchParams.date : null;
  const currentDate = dateParam ? parseISO(dateParam) : new Date();
  
  const { schedule, events, weekStart } = await getWeekSchedule(currentDate);

  const prevWeekLink = `/?date=${format(subWeeks(weekStart, 1), "yyyy-MM-dd")}`;
  const nextWeekLink = `/?date=${format(addWeeks(weekStart, 1), "yyyy-MM-dd")}`;

  const days = Array.from({ length: 6 }).map((_, i) => {
      const currentDayDate = addDays(weekStart, i);
      const dayOfWeek = i + 1; 

      // Фильтруем и сортируем события
      const dayEvents = events.filter((event) => isSameDay(parseISO(event.date), currentDayDate));
      
      const deadlines = dayEvents.filter(e => e.type === 'deadline').sort((a,b) => (a.event_time || '').localeCompare(b.event_time || ''));
      const timeEvents = dayEvents.filter(e => e.event_time && !e.pair_number).sort((a, b) => (a.event_time || '').localeCompare(b.event_time || ''));
      const gridEvents = dayEvents.filter(e => e.pair_number);

      // Собираем пары
      const rawLessons = schedule.filter((item) => item.day_of_week === dayOfWeek);
      const lessonsMap = new Map<number, any>();
      
      rawLessons.forEach(l => lessonsMap.set(l.pair_number, { ...l, event: null }));

      gridEvents.forEach(event => {
          if (!event.pair_number) return;
          const existingLesson = lessonsMap.get(event.pair_number);

          if (existingLesson) {
              lessonsMap.set(event.pair_number, { ...existingLesson, event });
          } else {
              // Виртуальная пара
              lessonsMap.set(event.pair_number, {
                  id: `virt-${event.id}`,
                  subject: event.subject || event.title, 
                  type: 'virtual', // Маркер виртуальной пары
                  pair_number: event.pair_number,
                  details: [{ subgroup: '', room: event.room || '', teacher: '' }],
                  event: event
              });
          }
      });

      const finalLessons = Array.from(lessonsMap.values()).sort((a, b) => a.pair_number - b.pair_number);

      return { date: currentDayDate, lessons: finalLessons, timeEvents, deadlines };
  });

  return (
    <main className="min-h-screen bg-gray-100 pb-10 font-sans text-gray-900">
      <header className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="flex justify-between items-center mb-2">
            <h1 className="text-lg font-bold">Расписание</h1>
            <Link href="/" className="text-xs bg-blue-500 px-2 py-1 rounded hover:bg-blue-400 transition">Сегодня</Link>
        </div>
        <div className="flex items-center justify-between">
            <Link href={prevWeekLink} className="p-2 hover:bg-blue-700 rounded transition">←</Link>
            <p className="text-sm font-medium capitalize">{format(weekStart, "d MMMM", { locale: ru })} — {format(addDays(weekStart, 6), "d MMMM", { locale: ru })}</p>
            <Link href={nextWeekLink} className="p-2 hover:bg-blue-700 rounded transition">→</Link>
        </div>
      </header>

      <div className="max-w-md mx-auto p-3 space-y-4">
        {days.map((day) => (
             <div key={day.date.toString()} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Заголовок дня */}
                <div className={`p-3 border-b border-gray-100 flex justify-between items-center ${isSameDay(day.date, new Date()) ? 'bg-blue-50 text-blue-700' : 'bg-white'}`}>
                  <span className="font-bold capitalize">{format(day.date, "EEEE", { locale: ru })}</span>
                  <span className="text-sm font-medium opacity-50">{format(day.date, "d MMM", { locale: ru })}</span>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {day.lessons.length === 0 && day.timeEvents.length === 0 && day.deadlines.length === 0 ? (
                    <div className="p-5 text-center text-gray-300 text-sm">Нет занятий</div>
                  ) : (
                    <>
                      {/* 1. СОБЫТИЯ ВНЕ СЕТКИ (Экзамены) */}
                      {day.timeEvents.map(event => {
                          const style = EVENT_STYLES[event.type] || EVENT_STYLES.deadline;
                          return (
                            <div key={event.id} className={`p-4 border-l-4 ${style.border} ${style.bg}`}>
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{event.subject || event.title}</h3>
                                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/60 ${style.text}`}>
                                       {style.label}
                                    </span>
                                </div>
                                {(event.subject && event.title) && <p className="text-sm text-gray-600 mt-1">{event.title}</p>}
                                
                                <div className="text-sm text-gray-700 flex gap-3 items-center mt-2">
                                    <span className="font-bold bg-white/80 px-1.5 rounded text-xs py-0.5 shadow-sm">
                                        {event.event_time?.slice(0,5)}
                                    </span>
                                    {event.room && <span>Ауд. {event.room}</span>}
                                </div>
                            </div>
                          )
                      })}

                      {/* 2. ПАРЫ (Сетка) */}
                      {day.lessons.map((lesson) => {
                        const event = lesson.event;
                        const isCancel = event?.type === 'cancel';
                        const isSimple = lesson.details.length === 1 && !lesson.details[0].subgroup;
                        
                        // Определяем стиль контейнера
                        // Если есть событие -> используем его цвет, иначе -> белый
                        const eventStyle = event ? (EVENT_STYLES[event.type] || EVENT_STYLES.deadline) : null;
                        const containerClass = eventStyle 
                            ? `border-l-4 ${eventStyle.border} ${eventStyle.bg}` // Акцентный стиль
                            : `hover:bg-gray-50 border-l-4 border-transparent`;   // Обычный стиль

                        return (
                          <div key={lesson.id} className={`p-4 relative transition ${containerClass} ${isCancel ? 'grayscale opacity-60' : ''}`}>
                            <div className="flex gap-4">
                              
                              {/* Номер пары */}
                              <div className="flex flex-col items-center min-w-[1.5rem] pt-1">
                                <span className={`text-lg font-bold leading-none ${event ? 'text-gray-800' : 'text-gray-400'}`}>
                                    {lesson.pair_number}
                                </span>
                              </div>

                              <div className="w-full">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`font-bold text-lg leading-tight ${isCancel ? 'line-through' : 'text-gray-900'}`}>
                                        {lesson.subject}
                                    </h3>

                                    {/* БЕЙДЖИ */}
                                    {/* Если это настоящая пара, показываем её тип (Семинар/Лекция) */}
                                    {lesson.type !== 'virtual' && !isCancel && (
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border ${LESSON_BADGES[lesson.type] || LESSON_BADGES.other}`}>
                                            {LESSON_TYPES[lesson.type] || lesson.type}
                                        </span>
                                    )}
                                    {/* Если это виртуальная пара (Зачет), показываем тип события */}
                                    {lesson.type === 'virtual' && event && (
                                         <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border bg-white/60 ${eventStyle?.text}`}>
                                            {eventStyle?.label}
                                         </span>
                                    )}
                                </div>

                                {/* ЯРКИЙ ЗАГОЛОВОК СОБЫТИЯ (Контрольная/Отмена) */}
                                {event && lesson.type !== 'virtual' && (
                                    <div className={`text-xs font-black uppercase tracking-wider mb-2 ${isCancel ? 'text-gray-500' : eventStyle?.text}`}>
                                        {eventStyle?.label} 
                                        {event.title && <span className="font-medium normal-case ml-1 text-gray-600">— {event.title}</span>}
                                    </div>
                                )}

                                {/* Детали пары (Аудитории) */}
                                {isSimple ? (
                                    <div className="text-sm flex flex-col sm:flex-row sm:items-center sm:gap-2 mt-1 text-gray-700">
                                        <span className="font-medium">
                                            {lesson.details[0].room || '—'}
                                        </span>
                                        {!isCancel && <span className="hidden sm:inline text-gray-300">|</span>}
                                        <span className="text-gray-500">
                                            {lesson.details[0].teacher}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="mt-2 space-y-2">
                                        {lesson.details.map((detail: any, idx: number) => (
                                            <div key={idx} className="flex items-center text-sm bg-white/50 rounded-lg p-2 border border-gray-200/50">
                                                <div className="w-20 shrink-0 font-bold text-xs uppercase text-gray-700 leading-tight">
                                                    {detail.subgroup || "Общ."}
                                                </div>
                                                <div className="flex flex-col border-l border-gray-300 pl-3">
                                                    <span className="font-medium text-gray-900">{detail.room || "—"}</span>
                                                    <span className="text-xs text-gray-500">{detail.teacher}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* 3. ДЕДЛАЙНЫ (Подвал) */}
                      {day.deadlines.length > 0 && (
                          <div className="bg-orange-50 border-t border-orange-200 p-3">
                              <h4 className="text-[10px] font-bold text-orange-800 uppercase mb-2 tracking-wider">
                                  Дедлайны
                              </h4>
                              <div className="space-y-2">
                                  {day.deadlines.map(d => (
                                      <div key={d.id} className="text-sm flex justify-between items-start text-gray-900">
                                          <div className="flex gap-2">
                                            <span className="text-orange-400 font-bold">•</span>
                                            <span className="leading-tight">
                                                <span className="font-medium">{d.subject}</span>
                                                {d.title && <span className="text-gray-600"> — {d.title}</span>}
                                            </span>
                                          </div>
                                          <span className="text-xs font-bold bg-white text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">
                                              до {d.event_time?.slice(0,5)}
                                          </span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                    </>
                  )}
                </div>
             </div>
        ))}
      </div>
    </main>
  );
}