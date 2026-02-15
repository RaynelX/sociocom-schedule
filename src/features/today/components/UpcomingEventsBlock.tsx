import type { UpcomingEvent } from '../hooks/use-upcoming-events';

const EVENT_BADGE: Record<string, { label: string; className: string }> = {
  usr:           { label: 'УСР',    className: 'bg-violet-100 text-violet-700 dark:bg-violet-500/40 dark:text-violet-300' },
  control_work:  { label: 'КР',     className: 'bg-red-100 text-red-700 dark:bg-red-500/40 dark:text-red-300' },
  deadline:      { label: 'Дедл.',  className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/40 dark:text-amber-300' },
  credit:        { label: 'Зачёт',  className: 'bg-teal-100 text-teal-700 dark:bg-teal-500/40 dark:text-teal-300' },
  exam:          { label: 'Экз.',   className: 'bg-rose-100 text-rose-700 dark:bg-rose-500/40 dark:text-rose-300' },
  consultation:  { label: 'Конс.',  className: 'bg-sky-100 text-sky-700 dark:bg-sky-500/40 dark:text-sky-300' },
  other:         { label: 'Соб.',   className: 'bg-purple-100 text-purple-700 dark:bg-purple-500/40 dark:text-purple-300' },
};

interface Props {
  events: UpcomingEvent[];
}

export function UpcomingEventsBlock({ events }: Props) {
  if (events.length === 0) return null;

  return (
    <div>
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
          Ближайшие события
        </h3>
        <button className="text-sm text-blue-600 dark:text-blue-400 font-medium active:opacity-70 transition-opacity">
          Показать все &rsaquo;
        </button>
      </div>

      {/* Карточка */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-transparent px-4 py-2">
        {events.map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

function EventRow({ event }: { event: UpcomingEvent }) {
  const badge = EVENT_BADGE[event.eventType] ?? EVENT_BADGE.other;

  return (
    <div className="flex gap-2 py-2">
      {/* Дата */}
      <span className="text-sm text-neutral-400 dark:text-neutral-500 w-16 shrink-0 pt-0.5">
        {event.dateLabel}
      </span>

      {/* Бейдж */}
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 h-fit mt-0.5 ${badge.className}`}>
        {badge.label}
      </span>

      {/* Текст + пара */}
      <div className="flex-1 min-w-0 flex gap-2">
        <p className="text-sm flex-1">
          {event.subjectName && (
            <span className="text-neutral-800 dark:text-neutral-200">
              {event.subjectName}
            </span>
          )}
          {event.subjectName && event.description && (
            <span className="text-neutral-400 dark:text-neutral-500"> — </span>
          )}
          {event.description && (
            <span className="text-neutral-400 dark:text-neutral-500">
              {event.description}
            </span>
          )}
        </p>

        {event.timeLabel && (
          <span className="text-sm text-neutral-400 dark:text-neutral-500 shrink-0 pt-0.5">
            {event.timeLabel}
          </span>
        )}
      </div>
    </div>
  );
}