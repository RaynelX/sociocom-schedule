import type { ResolvedPair } from '../utils/schedule-builder';
import { isCurrentPair } from '../utils/week-utils';

// ============================================================
// Конфигурация визуальных стилей
// ============================================================

const ENTRY_TYPE_CONFIG: Record<
  string,
  { label: string; badge: string; border: string }
> = {
  lecture:  { label: 'Лекция',    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/40 dark:text-blue-300',     border: 'border-l-blue-500' },
  seminar: { label: 'Семинар',   badge: 'bg-green-100 text-green-700 dark:bg-green-500/40 dark:text-green-300',   border: 'border-l-green-500' },
  practice:{ label: 'Практика',  badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/40 dark:text-orange-300', border: 'border-l-orange-500' },
  other:   { label: 'Другое',    badge: 'bg-gray-100 text-gray-600 dark:bg-gray-500/40 dark:text-gray-300',     border: 'border-l-gray-400' },
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  replaced:  { label: 'Замена',     className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/40 dark:text-yellow-300' },
  added:     { label: 'Доп. пара',  className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/40 dark:text-emerald-300' },
  cancelled: { label: 'Отменено',   className: 'bg-red-100 text-red-700 dark:bg-red-500/40 dark:text-red-300' },
  event:     { label: 'Событие',    className: 'bg-purple-100 text-purple-700 dark:bg-purple-500/40 dark:text-purple-300' },
};

const EVENT_TYPE_CONFIG: Record<
  string,
  { label: string; badge: string; bg: string; darkBg: string; border: string }
> = {
  usr:           { label: 'УСР',          badge: 'bg-violet-100 text-violet-700 dark:bg-violet-500/40 dark:text-violet-300',   bg: 'bg-violet-50',  darkBg: 'dark:bg-violet-950/40', border: 'border-l-violet-500' },
  control_work:  { label: 'Контрольная',  badge: 'bg-red-100 text-red-700 dark:bg-red-500/40 dark:text-red-300',         bg: 'bg-red-50',     darkBg: 'dark:bg-red-950/40',    border: 'border-l-red-500' },
  deadline:      { label: 'Дедлайн',      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/40 dark:text-amber-300',     bg: 'bg-amber-50',   darkBg: 'dark:bg-amber-950/40',  border: 'border-l-amber-500' },
  credit:        { label: 'Зачёт',        badge: 'bg-teal-100 text-teal-700 dark:bg-teal-500/40 dark:text-teal-300',       bg: 'bg-teal-50',    darkBg: 'dark:bg-teal-950/40',   border: 'border-l-teal-500' },
  exam:          { label: 'Экзамен',      badge: 'bg-rose-100 text-rose-700 dark:bg-rose-500/40 dark:text-rose-300',       bg: 'bg-rose-50',    darkBg: 'dark:bg-rose-950/40',   border: 'border-l-rose-500' },
  consultation:  { label: 'Консультация', badge: 'bg-sky-100 text-sky-700 dark:bg-sky-500/40 dark:text-sky-300',         bg: 'bg-sky-50',     darkBg: 'dark:bg-sky-950/40',    border: 'border-l-sky-500' },
  other:         { label: 'Событие',      badge: 'bg-purple-100 text-purple-700 dark:bg-purple-500/40 dark:text-purple-300',   bg: 'bg-purple-50',  darkBg: 'dark:bg-purple-950/40', border: 'border-l-purple-500' },
};

// ============================================================
// Компонент: карточка пары
// ============================================================

interface PairCardProps {
  pair: ResolvedPair;
  startTime: string;
  endTime: string;
  date: Date;
}

export function PairCard({ pair, startTime, endTime, date }: PairCardProps) {
  const isCurrent = isCurrentPair(date, startTime, endTime);
  const isCancelled = pair.status === 'cancelled';
  const isEvent = pair.status === 'event';

  const eventConfig = pair.eventType ? EVENT_TYPE_CONFIG[pair.eventType] : null;
  const entryConfig = pair.entryType ? ENTRY_TYPE_CONFIG[pair.entryType] : null;
  const typeConfig = eventConfig ?? entryConfig;

  const statusBadge =
    pair.status !== 'normal' && pair.status !== 'event'
      ? STATUS_BADGE[pair.status]
      : null;

  const borderColor = isCancelled
    ? 'border-l-red-300'
    : pair.status === 'replaced'
      ? 'border-l-yellow-500'
      : pair.status === 'added'
        ? 'border-l-emerald-500'
        : typeConfig?.border ?? 'border-l-gray-300';

  const bgColor = isEvent && eventConfig
    ? `${eventConfig.bg} ${eventConfig.darkBg}`
    : 'bg-white dark:bg-neutral-900';

  return (
    <div
      className={`
        relative rounded-xl
        border-l-4 ${borderColor}
        border-t border-r border-b border-gray-200
        dark:border-t-transparent dark:border-r-transparent dark:border-b-transparent
        ${bgColor} p-4
        ${isCurrent ? 'ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-black' : ''}
        ${isCancelled ? 'opacity-60' : ''}
      `}
    >
      {/* Номер пары + время */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-500 dark:text-neutral-400">
          {pair.pairNumber} пара · {startTime} – {endTime}
        </span>
        <div className="flex gap-1.5">
          {statusBadge && (
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${statusBadge.className}`}>
              {statusBadge.label}
            </span>
          )}
        </div>
      </div>

      {/* Название предмета */}
      <p className={`text-base font-semibold text-gray-900 dark:text-neutral-100 ${isCancelled ? 'line-through' : ''}`}>
        {pair.subjectName}
      </p>

      {/* Детали */}
      {!isCancelled && (
        <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-neutral-300">
          {typeConfig && (
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${typeConfig.badge}`}>
              {typeConfig.label}
            </span>
          )}
          {pair.teacherName && <span>{pair.teacherName}</span>}
          {pair.room && (
            <span className="ml-auto text-gray-500 dark:text-neutral-400">
              {pair.room === 'ДОТ' ? 'ДОТ' : `ауд. ${pair.room}`}
            </span>
          )}
        </div>
      )}

      {/* Описание */}
      {pair.description && !isCancelled && (
        <p className="mt-2 text-sm text-gray-600 dark:text-neutral-300 leading-snug line-clamp-3">
          {pair.description}
        </p>
      )}

      {/* Комментарий */}
      {pair.comment && (
        <p className="mt-2 text-xs text-gray-500 dark:text-neutral-400 italic">{pair.comment}</p>
      )}

      {/* Текущая пара */}
      {isCurrent && (
        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
      )}
    </div>
  );
}

// ============================================================
// Компонент: окно между парами
// ============================================================

interface WindowCardProps {
  pairNumber: number;
  startTime: string;
  endTime: string;
}

export function WindowCard({ pairNumber, startTime, endTime }: WindowCardProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-gray-200 dark:border-neutral-800/50">
      <span className="text-sm text-gray-400 dark:text-neutral-500">
        {pairNumber} пара · {startTime} – {endTime}
      </span>
      <span className="text-sm text-gray-400 dark:text-neutral-500">Окно</span>
    </div>
  );
}

interface FloatingEventCardProps {
  description?: string;
  eventType: string;
  subjectName?: string;
  teacherName?: string;
  room?: string;
  eventTime?: string;
}

export function FloatingEventCard({
  description,
  eventType,
  subjectName,
  teacherName,
  room,
  eventTime,
}: FloatingEventCardProps) {
  const config = EVENT_TYPE_CONFIG[eventType] ?? EVENT_TYPE_CONFIG.other;

  return (
    <div className={`rounded-xl border border-gray-200 dark:border-neutral-800/50 ${config.bg} ${config.darkBg} p-4`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-500 dark:text-neutral-400">
          {eventTime ?? 'В течение дня'}
        </span>
      </div>

      <p className="text-base font-semibold text-gray-900 dark:text-neutral-100">
        {subjectName ?? 'Событие'}
      </p>

      <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-neutral-300">
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${config.badge}`}>
          {config.label}
        </span>
        {teacherName && <span>{teacherName}</span>}
        {room && (
          <span className="ml-auto text-gray-500 dark:text-neutral-400">
            {room === 'ДОТ' ? 'ДОТ' : `ауд. ${room}`}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-2 text-sm text-gray-600 dark:text-neutral-300 leading-snug line-clamp-3">
          {description}
        </p>
      )}
    </div>
  );
}
