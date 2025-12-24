import { RenderedLesson } from "@/lib/schedule-logic";
import { MapPin, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  lesson: RenderedLesson;
}

// Словарь локализации (чтобы было "Практика", а не "LAB")
const LESSON_LABELS: Record<string, string> = {
  lecture: "Лекция",
  seminar: "Семинар",
  lab: "Практика",
  other: "Другое",
  deadline: "Дедлайн",
  control_work: "К/Р",
  independent_work: "УСР",
  credit: "Зачёт",
  exam: "Экзамен",
  consultation: "Консультация",
  cancel: "Отмена",
};

// Стили бейджей (адаптированы под темную тему через dark:)
const TYPE_STYLES: Record<string, string> = {
  lecture: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
  seminar: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  lab: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  credit: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  exam: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  deadline: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
  cancel: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
};

export function LessonCard({ lesson }: Props) {
  // Логика: Простая ли это пара?
  const isSimple = !lesson.subgroups || (lesson.subgroups.length === 1 && !lesson.subgroups[0].subgroup);

  // Цвет индикатора слева
  const indicatorColor = lesson.isCancelled
    ? "bg-gray-400 dark:bg-gray-600"
    : lesson.isEvent
    ? lesson.eventColor
    : "bg-blue-500 dark:bg-blue-600"; 

  // Получаем ключи для стилей
  // lesson.type может прийти как "Лекция" (из UI) или "lecture" (из БД). 
  // Приводим к нижнему регистру для поиска в словаре, если это английский ключ.
  const rawType = lesson.type.toLowerCase();
  
  // Определяем лейбл (На русском)
  const label = LESSON_LABELS[rawType] || lesson.type;
  
  // Определяем стили (Fallback на 'other')
  // Пытаемся найти по ключу, если нет - берем 'other'
  const badgeStyle = TYPE_STYLES[rawType] || 
                     Object.entries(LESSON_LABELS).find(([key, val]) => val === lesson.type)?.[0] && TYPE_STYLES[Object.entries(LESSON_LABELS).find(([key, val]) => val === lesson.type)![0]] ||
                     TYPE_STYLES.other;

  return (
    <div className={cn(
      "relative flex w-full rounded-2xl shadow-sm border overflow-hidden mb-3 transition-all active:scale-[0.99]",
      // Адаптация под тему:
      "bg-[var(--ios-card)] border-gray-100 dark:border-[#2c2c2e]", 
      lesson.isCancelled && "opacity-60 grayscale"
    )}>
      {/* Левая цветная полоса */}
      <div className={cn("w-1.5 shrink-0", indicatorColor)} />

      <div className="flex w-full p-3.5 gap-3.5">
        {/* КОЛОНКА 1: Время и Номер */}
        <div className="flex flex-col items-center min-w-[3rem] pt-0.5 border-r border-gray-100 dark:border-gray-800 pr-3.5">
            <span className={cn(
                "text-2xl font-bold leading-none mb-1",
                lesson.isEvent ? "text-[var(--foreground)]" : "text-gray-400 dark:text-gray-500"
            )}>
                {lesson.pairNumber}
            </span>
            <div className="flex flex-col items-center text-[10px] font-medium text-gray-400 dark:text-gray-500 leading-tight">
                <span>{lesson.startTime}</span>
                <div className="h-px w-3 bg-gray-200 dark:bg-gray-700 my-0.5"></div>
                <span>{lesson.endTime}</span>
            </div>
        </div>

        {/* КОЛОНКА 2: Контент */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
            
            {/* Верхняя строка: Заголовок и Бейдж */}
            <div className="flex justify-between items-start gap-2 mb-1.5">
                <h3 className={cn(
                  "text-[15px] font-bold leading-tight line-clamp-2",
                  "text-[var(--foreground)]", // Используем глобальную переменную для текста
                  lesson.isCancelled && "line-through text-gray-400 dark:text-gray-500"
                )}>
                  {lesson.subjectName}
                </h3>
                
                <span className={cn(
                    "shrink-0 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide border",
                    badgeStyle
                )}>
                    {label}
                </span>
            </div>

            {/* Контент: Простая пара */}
            {isSimple && (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center text-gray-700 dark:text-gray-300">
                        <MapPin size={13} className="mr-1.5 text-gray-400 shrink-0" />
                        <span className="font-semibold text-xs truncate">
                            {lesson.room || (lesson.subgroups?.[0]?.room) || "—"}
                        </span>
                    </div>
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                        <User size={13} className="mr-1.5 text-gray-400 shrink-0" />
                        <span className="text-xs truncate">
                            {lesson.teacher || (lesson.subgroups?.[0]?.teacher) || "—"}
                        </span>
                    </div>
                </div>
            )}

            {/* Контент: Подгруппы (Grid Layout) */}
            {!isSimple && lesson.subgroups && (
                <div className="mt-1 space-y-1.5 w-full">
                    {lesson.subgroups.map((sub, idx) => (
                         <div key={idx} className={cn(
                           "grid grid-cols-[auto_1fr_auto] gap-3 items-center rounded-lg p-2 border",
                           // Стили для подложки подгруппы (светлая/темная)
                           "bg-gray-50/80 border-gray-100/50", 
                           "dark:bg-white/5 dark:border-white/5"
                         )}>
                             {/* Col 1: Номер подгруппы */}
                             <span className={cn(
                               "font-bold text-[10px] px-1.5 py-0.5 rounded border",
                               "text-blue-600 bg-blue-50 border-blue-100",
                               "dark:text-blue-300 dark:bg-blue-900/30 dark:border-blue-800"
                             )}>
                                 {sub.subgroup}
                             </span>
                             
                             {/* Col 2: Преподаватель (растягивается) */}
                             <span className="text-[11px] text-gray-600 dark:text-gray-400 truncate">
                                 {sub.teacher}
                             </span>
                             
                             {/* Col 3: Кабинет (справа) */}
                             <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                                {sub.room}
                             </span>
                         </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}