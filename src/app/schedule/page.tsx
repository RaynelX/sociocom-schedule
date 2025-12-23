"use client";

import { useAppStore } from "@/lib/store";
import { getLessonsForDate } from "@/lib/schedule-logic";
import { LessonCard } from "@/components/schedule/LessonCard";
import { addDays, format, startOfWeek, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function SchedulePage() {
  const { scheduleItems, events, bellSchedule, isLoading } = useAppStore();
  
  // Состояние: какая неделя выбрана? (По дефолту - текущая)
  const [currentDate, setCurrentDate] = useState(new Date());

  // Вычисляем начало недели (Понедельник)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  
  // Генерируем массив из 6 дней (Пн-Сб)
  const weekDays = Array.from({ length: 6 }).map((_, i) => addDays(weekStart, i));

  if (isLoading) {
    // Простейший скелетон или лоадер
    return <div className="p-4 text-center text-gray-400">Загрузка данных...</div>;
  }

  return (
    <div className="min-h-screen bg-[--ios-bg] pt-4 px-4 pb-24">
      {/* Заголовок с датами */}
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black">Расписание</h1>
          <p className="text-sm text-gray-500 font-medium capitalize">
            {format(weekStart, "d MMMM", { locale: ru })} — {format(addDays(weekStart, 5), "d MMMM", { locale: ru })}
          </p>
        </div>
        {/* Тут можно добавить кнопки "Пред/След неделя" позже */}
      </header>

      {/* Список дней */}
      <div className="space-y-8">
        {weekDays.map((dayDate) => {
          const lessons = getLessonsForDate(dayDate, scheduleItems, events, bellSchedule);
          const isToday = isSameDay(dayDate, new Date());

          return (
            <section key={dayDate.toISOString()}>
              {/* Заголовок дня (sticky header как в iOS) */}
              <div className="sticky top-0 z-10 bg-[--ios-bg]/95 backdrop-blur-sm py-2 mb-2 border-b border-gray-200/50 flex items-baseline">
                <h2 className={cn(
                  "text-lg font-bold capitalize mr-2",
                  isToday ? "text-blue-600" : "text-gray-900"
                )}>
                  {format(dayDate, "EEEE", { locale: ru })}
                </h2>
                <span className="text-sm text-gray-400 font-medium">
                  {format(dayDate, "d MMM", { locale: ru })}
                </span>
              </div>

              {/* Список пар */}
              <div className="space-y-1">
                {lessons.length > 0 ? (
                  lessons.map(lesson => (
                    <LessonCard key={lesson.id} lesson={lesson} />
                  ))
                ) : (
                  <div className="py-6 text-center text-gray-400 text-sm italic bg-white/50 rounded-xl border border-dashed border-gray-200">
                    Нет пар.
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}