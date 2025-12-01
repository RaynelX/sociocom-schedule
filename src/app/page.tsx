import { getWeekSchedule } from "@/lib/scheduleService";
import { format, addDays, isSameDay, parseISO, addWeeks, subWeeks } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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
    <main className="min-h-screen bg-gray-50 pb-10 font-sans text-gray-900">
      <header className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="flex justify-between items-center mb-2">
            <h1 className="text-lg font-bold">Расписание</h1>
            <Link href="/" className="text-xs bg-blue-500 px-2 py-1 rounded hover:bg-blue-400 transition">
                Сегодня
            </Link>
        </div>
        
        <div className="flex items-center justify-between">
            <Link href={prevWeekLink} className="p-2 hover:bg-blue-700 rounded transition">←</Link>
            <p className="text-sm font-medium capitalize">
                {format(weekStart, "d MMMM", { locale: ru })} — {format(addDays(weekStart, 6), "d MMMM", { locale: ru })}
            </p>
            <Link href={nextWeekLink} className="p-2 hover:bg-blue-700 rounded transition">→</Link>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {days.map((day) => (
             <div key={day.date.toString()} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className={`p-3 border-b flex justify-between items-center ${isSameDay(day.date, new Date()) ? 'bg-blue-50 text-blue-700' : 'bg-gray-50'}`}>
                  <span className="font-bold capitalize">{format(day.date, "EEEE", { locale: ru })}</span>
                  <span className="text-sm font-medium opacity-60">{format(day.date, "d MMM", { locale: ru })}</span>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {day.lessons.length === 0 && day.events.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-sm">Нет занятий</div>
                  ) : (
                    <>
                      {day.lessons.map((lesson) => {
                        const eventOnThisPair = day.events.find(e => e.pair_number === lesson.pair_number);
                        return (
                          <div key={lesson.id} className="p-3 relative group hover:bg-gray-50 transition">
                            {eventOnThisPair && (
                              <div className="mb-2 text-xs font-bold text-red-600 border border-red-200 bg-red-50 px-2 py-1 rounded w-fit">
                                {eventOnThisPair.title}
                              </div>
                            )}
                            <div className="flex gap-3">
                              <div className="flex flex-col items-center justify-start min-w-[2.5rem] pt-1">
                                <span className="text-lg font-bold text-gray-400">{lesson.pair_number}</span>
                              </div>
                              <div className="w-full">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-semibold text-gray-900 leading-tight pr-2">{lesson.subject}</h3>
                                    {/* БЕЙДЖ ПОДГРУППЫ */}
                                    {lesson.subgroup && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded whitespace-nowrap">
                                            {lesson.subgroup === '1' ? '1 подгр.' : lesson.subgroup === '2' ? '2 подгр.' : lesson.subgroup}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                  <span className={`px-1.5 rounded text-xs border ${
                                      lesson.type === 'lecture' ? 'border-green-200 text-green-700 bg-green-50' : 
                                      lesson.type === 'seminar' ? 'border-blue-200 text-blue-700 bg-blue-50' : 
                                      'border-orange-200 text-orange-700 bg-orange-50'
                                  }`}>
                                    {lesson.type === 'lecture' ? 'Лекция' : lesson.type === 'seminar' ? 'Семинар' : lesson.type === 'lab' ? 'Лаб' : lesson.type}
                                  </span>
                                  <span>{lesson.room}</span>
                                </p>
                                {lesson.teacher && <p className="text-xs text-gray-400 mt-1">{lesson.teacher}</p>}
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