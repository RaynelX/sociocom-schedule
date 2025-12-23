import { RenderedLesson } from "@/lib/schedule-logic";
import { Clock, MapPin, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  lesson: RenderedLesson;
}

export function LessonCard({ lesson }: Props) {
  // Определяем цвет полоски слева
  const indicatorColor = lesson.isCancelled
    ? "bg-gray-300"
    : lesson.isEvent
    ? lesson.eventColor
    : "bg-blue-500"; // Стандартный цвет пар

  return (
    <div className={cn(
      "relative flex w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-3 transition-opacity",
      lesson.isCancelled && "opacity-60 grayscale"
    )}>
      {/* Цветной индикатор */}
      <div className={cn("w-1.5 shrink-0", indicatorColor)} />

      <div className="flex-1 p-3 min-w-0">
        {/* Верхняя строка: Время и Тип */}
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center text-xs font-medium text-gray-500">
            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] mr-2">
              {lesson.pairNumber} пара
            </span>
            <Clock size={12} className="mr-1" />
            {lesson.startTime} - {lesson.endTime}
          </div>
          <span className={cn(
            "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full",
            lesson.isEvent ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
          )}>
            {lesson.type}
          </span>
        </div>

        {/* Название предмета */}
        <h3 className={cn(
          "text-base font-semibold leading-tight mb-2 truncate",
          lesson.isCancelled && "line-through text-gray-400"
        )}>
          {lesson.subjectName}
        </h3>

        {/* Детали: Аудитория и Преподаватель (если нет подгрупп) */}
        {!lesson.subgroups && (
          <div className="flex flex-wrap gap-3 text-xs text-gray-600">
            {lesson.room && (
              <div className="flex items-center bg-gray-50 px-2 py-1 rounded-md">
                <MapPin size={12} className="mr-1 text-gray-400" />
                {lesson.room}
              </div>
            )}
            {lesson.teacher && (
              <div className="flex items-center bg-gray-50 px-2 py-1 rounded-md">
                <User size={12} className="mr-1 text-gray-400" />
                {lesson.teacher}
              </div>
            )}
          </div>
        )}

        {/* Подгруппы (JSONB) */}
        {lesson.subgroups && (
          <div className="mt-2 space-y-1.5">
            {lesson.subgroups.map((sub, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs bg-gray-50 p-1.5 rounded-md border border-gray-100">
                <span className="font-semibold text-gray-700 w-8">{sub.subgroup}</span>
                <span className="text-gray-600 truncate flex-1 mx-2">{sub.teacher}</span>
                <span className="font-mono text-gray-500 bg-white px-1.5 rounded border border-gray-200">
                  {sub.room}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}