import type { UpcomingEventGroup } from '../hooks/use-upcoming-events';

const EVENT_CONFIG: Record<
  string,
  { label: string; badge: string; bg: string; darkBg: string; border: string }
> = {
  usr:           { label: 'УСР',          badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',  bg: 'bg-violet-50',  darkBg: 'dark:bg-violet-950/40',  border: 'border-l-violet-500' },
  control_work:  { label: 'Контрольная',  badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',              bg: 'bg-red-50',     darkBg: 'dark:bg-red-950/40',     border: 'border-l-red-500' },
  deadline:      { label: 'Дедлайн',      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',      bg: 'bg-amber-50',   darkBg: 'dark:bg-amber-950/40',   border: 'border-l-amber-500' },
  credit:        { label: 'Зачёт',        badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',          bg: 'bg-teal-50',    darkBg: 'dark:bg-teal-950/40',    border: 'border-l-teal-500' },
  exam:          { label: 'Экзамен',      badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',          bg: 'bg-rose-50',    darkBg: 'dark:bg-rose-950/40',    border: 'border-l-rose-500' },
  consultation:  { label: 'Консультация', badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',              bg: 'bg-sky-50',     darkBg: 'dark:bg-sky-950/40',     border: 'border-l-sky-500' },
  other:         { label: 'Событие',      badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',  bg: 'bg-purple-50',  darkBg: 'dark:bg-purple-950/40',  border: 'border-l-purple-500' },
};

interface Props {
  groups: UpcomingEventGroup[];
}

export function UpcomingEventsBlock({ groups }: Props) {
  if (groups.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2 px-1">
        Ближайшие события
      </h3>

      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.date}>
            <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 mb-2 px-1">
              {group.label}
            </p>

            <div className="space-y-2.5">
              {group.events.map((event) => {
                const config = EVENT_CONFIG[event.eventType] ?? EVENT_CONFIG.other;

                return (
                  <div
                    key={event.id}
                    className={`
                      rounded-xl
                      border-t border-r border-b border-gray-200
                      dark:border-t-transparent dark:border-r-transparent dark:border-b-transparent
                      border-l-4 ${config.border}
                      ${config.bg} ${config.darkBg}
                      p-4
                    `}
                  >
                    {/* Время */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">
                        {event.pairLabel}
                      </span>
                    </div>

                    {/* Предмет */}
                    <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                      {event.subjectName ?? 'Событие'}
                    </p>

                    {/* Детали */}
                    <div className="flex items-center gap-2 mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${config.badge}`}>
                        {config.label}
                      </span>
                      {event.room && (
                        <span className="ml-auto text-neutral-500 dark:text-neutral-400">
                          {event.room === 'ДОТ' ? 'ДОТ' : `ауд. ${event.room}`}
                        </span>
                      )}
                    </div>

                    {/* Описание */}
                    {event.description && (
                      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300 leading-snug line-clamp-3">
                        {event.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}