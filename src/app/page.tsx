import { getBells, getWeekSchedule } from "@/lib/scheduleService";
import { format, addDays, isSameDay, parseISO, addWeeks, subWeeks, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";
import ScrollToToday from "@/components/ScrollToToday"; 
import TodayButton from "@/components/TodayButton";

export const dynamic = 'force-dynamic';

// --- Типы ---
type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

interface Event {
  id: string;
  type: string;
  date: string;
  title?: string;
  subject?: string;
  event_time?: string;
  pair_number?: number;
  room?: string;
}

interface Lesson {
  id: string;
  day_of_week: number;
  pair_number: number;
  subject: string;
  type: string;
  details: Array<{ subgroup: string; room: string; teacher: string }>;
  event?: Event | null;
}

// --- Константы ---
const LESSON_TYPES: Record<string, string> = {
  lecture: 'Лекция', seminar: 'Семинар', lab: 'Практика', other: 'Другое'
};

const LESSON_BADGES: Record<string, string> = {
  lecture: 'border-green-200 text-green-700 bg-green-50',
  seminar: 'border-blue-200 text-blue-700 bg-blue-50',
  lab: 'border-orange-200 text-orange-700 bg-orange-50',
  other: 'border-gray-200 text-gray-700 bg-gray-50'
};

const EVENT_STYLES: Record<string, { label: string; border: string; bg: string; text: string }> = {
  control_work: { label: 'Контрольная работа', border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-700' },
  independent_work: { label: 'УСР', border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
  credit: { label: 'Зачёт', border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-800' },
  exam: { label: 'Экзамен', border: 'border-purple-600', bg: 'bg-purple-50', text: 'text-purple-800' },
  consultation: { label: 'Консультация', border: 'border-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-800' },
  cancel: { label: 'Отмена', border: 'border-gray-400', bg: 'bg-gray-100', text: 'text-gray-500' },
  deadline: { label: 'Дедлайн', border: 'border-orange-400', bg: 'bg-orange-50', text: 'text-orange-900' },
};

// --- Вспомогательные функции ---

/**
 * Расписание + ивенты
 */
function processDaySchedule(
  rawLessons: any[], 
  dayEvents: Event[]
) {
  
  const deadlines = dayEvents
    .filter(e => e.type === 'deadline')
    .sort((a,b) => (a.event_time || '').localeCompare(b.event_time || ''));
    
  const timeEvents = dayEvents
    .filter(e => e.event_time && !e.pair_number)
    .sort((a, b) => (a.event_time || '').localeCompare(b.event_time || ''));
    
  const gridEvents = dayEvents.filter(e => e.pair_number);

  const lessonsMap = new Map<number, Lesson>();
  
  rawLessons.forEach(l => {
    lessonsMap.set(l.pair_number, { ...l, event: null });
  });

  gridEvents.forEach(event => {
      if (!event.pair_number) return;
      const existingLesson = lessonsMap.get(event.pair_number);
      
      if (existingLesson) {
          // Ивент присобачиваем к парам
          lessonsMap.set(event.pair_number, { ...existingLesson, event });
      } else {
          // Если пары такой нет, делаем вот это
          lessonsMap.set(event.pair_number, {
              id: `virt-${event.id}`, 
              subject: event.subject || event.title || 'Событие', 
              type: 'virtual', 
              day_of_week: 0,
              pair_number: event.pair_number, 
              details: [{ subgroup: '', room: event.room || '', teacher: '' }], 
              event: event
          });
      }
  });

  const finalLessons = Array.from(lessonsMap.values()).sort((a, b) => a.pair_number - b.pair_number);

  return { lessons: finalLessons, timeEvents, deadlines };
}

export default async function Home(props: Props) {
  const searchParams = await props.searchParams;
  const dateParam = typeof searchParams.date === 'string' ? searchParams.date : null;
  const currentDate = dateParam ? parseISO(dateParam) : new Date();
  
  const weekDataPromise = getWeekSchedule(currentDate);
  const bellPromise = getBells();
  const [ { schedule, events, weekStart }, bells ] = await Promise.all([weekDataPromise, bellPromise])

  const eventsByDate: Record<string, Event[]> = {};
  events.forEach((event: any) => {
    const dateKey = event.date.split('T')[0];
    if (!eventsByDate[dateKey]) eventsByDate[dateKey] = [];
    eventsByDate[dateKey].push(event);
  });

  const scheduleByDay: Record<number, any[]> = {};
  schedule.forEach((item: any) => {
    if (!scheduleByDay[item.day_of_week]) scheduleByDay[item.day_of_week] = [];
    scheduleByDay[item.day_of_week].push(item);
  });

  // Генерируем дни недели
  const days = Array.from({ length: 6 }).map((_, i) => {
      const currentDayDate = addDays(weekStart, i);
      const dayOfWeek = i + 1; 
      const dateKey = format(currentDayDate, 'yyyy-MM-dd');
      const isToday = isSameDay(currentDayDate, new Date()); 

      const dayEvents = eventsByDate[dateKey] || [];
      const rawLessons = scheduleByDay[dayOfWeek] || [];

      const { lessons, timeEvents, deadlines } = processDaySchedule(rawLessons, dayEvents);

      return { date: currentDayDate, lessons, timeEvents, deadlines, isToday };
  });

  const prevWeekLink = `/?date=${format(subWeeks(weekStart, 1), "yyyy-MM-dd")}`;
  const nextWeekLink = `/?date=${format(addWeeks(weekStart, 1), "yyyy-MM-dd")}`;

  // Сортир овка всех дедлайнов
  const allDeadlines = events
    .filter((e: any) => e.type === 'deadline')
    .sort((a: any, b: any) => {
        // Сначала по дате
        const dateDiff = a.date.localeCompare(b.date);
        if (dateDiff !== 0) return dateDiff;
        // Потом по времени
        return (a.event_time || '').localeCompare(b.event_time || '');
    });

  return (
    <main className="min-h-screen bg-gray-100 pb-20 font-sans text-gray-900">
      <ScrollToToday />

      <header className="bg-blue-600 text-white px-4 py-3 sticky top-0 z-10 shadow-md">
        <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-3">
                <h1 className="text-base font-bold">Расписание</h1>
                <TodayButton />
            </div>
            
            <Link href="/planner" className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                </svg>
                Планер
            </Link>
        </div>
        
        <div className="flex items-center justify-between mt-2">
            <Link href={prevWeekLink} className="p-1 hover:bg-blue-700 rounded transition text-lg leading-none opacity-80 hover:opacity-100">←</Link>
            <p className="text-sm font-medium opacity-90">
                {format(weekStart, "d MMMM", { locale: ru }).toLowerCase()} — {format(addDays(weekStart, 6), "d MMMM", { locale: ru }).toLowerCase()}
            </p>
            <Link href={nextWeekLink} className="p-1 hover:bg-blue-700 rounded transition text-lg leading-none opacity-80 hover:opacity-100">→</Link>
        </div>
      </header>

      {allDeadlines.length > 0 && (
          <div className="max-w-md mx-auto p-3 pb-0">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-orange-800 uppercase mb-3 tracking-wider flex items-center gap-2">
                      Дедлайны
                  </h3>
                  <div className="space-y-2.5">
                      {allDeadlines.map((d: any) => (
                          <div key={d.id} className="flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-1">
                              <div className="text-gray-900 leading-tight">
                                  <span className="font-bold text-orange-900 mr-2 uppercase">
                                      {format(parseISO(d.date), 'EEEE', {locale: ru})}:
                                  </span> 
                                  <span className="font-medium">{d.subject}</span>
                                  {d.title && <span className="text-gray-600"> — {d.title}</span>}
                              </div>
                              
                              {d.event_time && (
                                <div className="shrink-0">
                                    <span className="text-[10px] font-bold bg-white text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                                        {d.event_time.slice(0,5)}
                                    </span>
                                </div>
                              )}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      <div className="max-w-md mx-auto p-3 space-y-4">
        {days.map((day) => (
             <div 
                key={day.date.toISOString()} // Better key
                id={day.isToday ? "today" : undefined}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden scroll-mt-28
                    ${day.isToday ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200'}`}
             >
                <div className={`p-3 border-b border-gray-100 flex justify-between items-center ${day.isToday ? 'bg-blue-50 text-blue-700' : 'bg-white'}`}>
                  <span className="font-bold capitalize">{format(day.date, "EEEE", { locale: ru })}</span>
                  <span className={`text-sm font-medium ${day.isToday ? 'opacity-100' : 'opacity-50'}`}>
                      {format(day.date, "d MMMM", { locale: ru }).toLowerCase()}
                  </span>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {day.lessons.length === 0 && day.timeEvents.length === 0 && day.deadlines.length === 0 ? (
                    <div className="p-5 text-center text-gray-300 text-sm">Нет занятий</div>
                  ) : (
                    <>
                      {day.timeEvents.map(event => {
                          const style = EVENT_STYLES[event.type] || EVENT_STYLES.deadline;
                          return (
                            <div key={event.id} className={`p-4 border-l-4 ${style.border} ${style.bg}`}>
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{event.subject || event.title}</h3>
                                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/60 ${style.text}`}>{style.label}</span>
                                </div>
                                {(event.subject && event.title) && <p className="text-sm text-gray-600 mt-1">{event.title}</p>}
                                <div className="text-sm text-gray-700 flex gap-3 items-center mt-2">
                                    <span className="font-bold bg-white/80 px-1.5 rounded text-xs py-0.5 shadow-sm">{event.event_time?.slice(0,5)}</span>
                                    {event.room && <span>{event.room}</span>}
                                </div>
                            </div>
                          )
                      })}
                      
                      {day.lessons.map((lesson) => {
                        const event = lesson.event;
                        const isCancel = event?.type === 'cancel';
                        const isSimple = lesson.details.length === 1 && !lesson.details[0].subgroup;
                        const eventStyle = event ? (EVENT_STYLES[event.type] || EVENT_STYLES.deadline) : null;
                        const containerClass = eventStyle ? `border-l-4 ${eventStyle.border} ${eventStyle.bg}` : `hover:bg-gray-50 border-l-4 border-transparent`;

                        return (
                          <div key={lesson.id} className={`p-4 relative transition ${containerClass} ${isCancel ? 'grayscale opacity-60' : ''}`}>
                            <div className="flex gap-4">
                              <div className="flex flex-col items-center min-w-[1.5rem] pt-1">
                                <span className={`text-lg font-bold leading-none ${event ? 'text-gray-800' : 'text-gray-400'}`}>{lesson.pair_number}</span>
                                {(() => {
                                  const bell = bells.find(b => b.pair_number === lesson.pair_number);
                                  if (!bell) return null;
                                  return (
                                    <div className="flex flex-col item-center text-center text-[9px] font-medium text-gray-400 mt-1 leading-tight">
                                      <span>{bell.start_time.slice(0,5)}</span>
                                      <span>{bell.end_time.slice(0,5)}</span>
                                    </div>
                                  );
                                })()}
                              </div>
                              <div className="w-full">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`font-bold text-lg leading-tight ${isCancel ? 'line-through' : 'text-gray-900'}`}>{lesson.subject}</h3>
                                    {lesson.type !== 'virtual' && !isCancel && (
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border ${LESSON_BADGES[lesson.type] || LESSON_BADGES.other}`}>{LESSON_TYPES[lesson.type] || lesson.type}</span>
                                    )}
                                    {lesson.type === 'virtual' && event && eventStyle && (
                                         <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border bg-white/60 ${eventStyle.text}`}>{eventStyle.label}</span>
                                    )}
                                </div>
                                {event && lesson.type !== 'virtual' && eventStyle && (
                                    <div className={`text-xs font-black uppercase tracking-wider mb-2 ${isCancel ? 'text-gray-500' : eventStyle.text}`}>{eventStyle.label} {event.title && <span className="font-medium normal-case ml-1 text-gray-600">— {event.title}</span>}</div>
                                )}
                                {isSimple ? (
                                    <div className="text-sm flex flex-col sm:flex-row sm:items-center sm:gap-2 mt-1 text-gray-700">
                                        <span className="font-medium">{lesson.details[0].room || '—'}</span>
                                        {!isCancel && <span className="hidden sm:inline text-gray-300">|</span>}
                                        <span className="text-gray-500">{lesson.details[0].teacher}</span>
                                    </div>
                                ) : (
                                    <div className="mt-2 space-y-2">
                                        {lesson.details.map((detail, idx) => (
                                            <div key={idx} className="flex items-center text-sm bg-white/50 rounded-lg p-2 border border-gray-200/50">
                                                <div className="w-20 shrink-0 font-bold text-xs uppercase text-gray-700 leading-tight">{detail.subgroup || "Общ."}</div>
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
                    </>
                  )}
                </div>
             </div>
        ))}
      </div>
    </main>
  );
}