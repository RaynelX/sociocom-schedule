import { getWeekSchedule } from "@/lib/scheduleService";
import { format, addDays, isSameDay, parseISO, addWeeks, subWeeks } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Вспомогательная функция для получения цвета и названия типа пары
const getTypeStyle = (type: string) => {
  switch (type) {
    case 'lecture': return { label: 'Лекция', style: 'border-green-200 text-green-700 bg-green-50' };
    case 'seminar': return { label: 'Семинар', style: 'border-blue-200 text-blue-700 bg-blue-50' };
    case 'lab': return { label: 'Практика', style: 'border-orange-200 text-orange-700 bg-orange-50' };
    case 'other': return { label: 'Другое', style: 'border-gray-200 text-gray-700 bg-gray-50' };
    default: return { label: type, style: 'border-gray-200 text-gray-700 bg-gray-50' };
  }
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

      const daySchedule = schedule
        .filter((item) => item.day_of_week === dayOfWeek)
        .sort((a, b) => a.pair_number - b.pair_number);

      const dayEvents = events.filter((event) => 
        isSameDay(parseISO(event.date), currentDayDate)
      );

      return { date: currentDayDate, lessons: daySchedule, events: dayEvents };
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
                <div className={`p-3 border-b border-gray-100 flex justify-between items-center ${isSameDay(day.date, new Date()) ? 'bg-blue-50 text-blue-700' : 'bg-white'}`}>
                  <span className="font-bold capitalize">{format(day.date, "EEEE", { locale: ru })}</span>
                  <span className="text-sm font-medium opacity-50">{format(day.date, "d MMM", { locale: ru })}</span>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {day.lessons.length === 0 && day.events.length === 0 ? (
                    <div className="p-5 text-center text-gray-300 text-sm">Нет занятий</div>
                  ) : (
                    <>
                      {day.lessons.map((lesson) => {
                        const eventOnThisPair = day.events.find(e => e.pair_number === lesson.pair_number);
                        const isSimple = lesson.details.length === 1 && !lesson.details[0].subgroup;
                        const typeInfo = getTypeStyle(lesson.type);

                        return (
                          <div key={lesson.id} className="p-4 relative hover:bg-gray-50 transition">
                            {eventOnThisPair && (
                              <div className="mb-2 text-xs font-bold text-red-600 border border-red-200 bg-red-50 px-2 py-1 rounded w-fit">
                                🔥 {eventOnThisPair.title}
                              </div>
                            )}
                            
                            <div className="flex gap-4">
                              {/* Номер пары */}
                              <div className="flex flex-col items-center min-w-[1.5rem] pt-1">
                                <span className="text-lg font-bold text-gray-400 leading-none">{lesson.pair_number}</span>
                              </div>

                              {/* Контент пары */}
                              <div className="w-full">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-gray-900 leading-tight text-lg">{lesson.subject}</h3>
                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border ${typeInfo.style}`}>
                                      {typeInfo.label}
                                    </span>
                                </div>

                                {/* Если пара для всей группы */}
                                {isSimple ? (
                                    <div className="text-sm flex flex-col sm:flex-row sm:items-center sm:gap-2 mt-1">
                                        <span className="font-medium text-gray-900">
                                            {lesson.details[0].room || 'Ауд. не указана'}
                                        </span>
                                        <span className="hidden sm:inline text-gray-300">|</span>
                                        <span className="text-gray-500">
                                            {lesson.details[0].teacher}
                                        </span>
                                    </div>
                                ) : (
                                    /* Если пара по подгруппам */
                                    <div className="mt-2 space-y-2">
                                        {lesson.details.map((detail, idx) => (
                                            <div key={idx} className="flex items-center text-sm bg-gray-50 rounded-lg p-2 border border-gray-100">
                                                <div className="w-20 shrink-0 font-bold text-xs uppercase text-gray-700 leading-tight">
                                                    {detail.subgroup || "Общ."}
                                                </div>
                                                <div className="flex flex-col border-l border-gray-200 pl-3">
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