import { useNavigate } from 'react-router-dom';
import type { TodayScheduleData } from '../hooks/use-today-schedule';
import type { DaySlot } from '../../schedule/utils/schedule-builder';
import { useCurrentMinutes } from '../hooks/use-current-time';

interface Props {
  data: TodayScheduleData;
}

const TYPE_BADGE: Record<string, { label: string; className: string }> = {
  lecture:   { label: 'Лек.',  className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/40 dark:text-blue-300' },
  seminar:   { label: 'Сем.',  className: 'bg-green-100 text-green-700 dark:bg-green-500/40 dark:text-green-300' },
  practice:  { label: 'Пр.',   className: 'bg-orange-100 text-orange-700 dark:bg-orange-500/40 dark:text-orange-300' },
  other:     { label: 'Др.',   className: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-300/40 dark:text-neutral-300' },
};

const EVENT_BADGE: Record<string, { label: string; className: string }> = {
  usr:           { label: 'УСР',    className: 'bg-violet-100 text-violet-700 dark:bg-violet-500/40500/40 dark:text-violet-300' },
  control_work:  { label: 'КР',     className: 'bg-red-100 text-red-700 dark:bg-red-500/40 dark:text-red-300' },
  credit:        { label: 'Зачёт',  className: 'bg-teal-100 text-teal-700 dark:bg-teal-500/40 dark:text-teal-300' },
  exam:          { label: 'Экз.',   className: 'bg-rose-100 text-rose-700 dark:bg-rose-500/40 dark:text-rose-300' },
  consultation:  { label: 'Конс.',  className: 'bg-sky-100 text-sky-700 dark:bg-sky-500/40 dark:text-sky-300' },
  other:         { label: 'Соб.',   className: 'bg-purple-100 text-purple-700 dark:bg-purple-500/40 dark:text-purple-300' },
};

export function TodayPairsBlock({ data }: Props) {
  if (!data.hasPairsToday && !data.nextDay) {
    return (
      <Section title="Расписание">
        <EmptyCard text="Нет предстоящих пар" />
      </Section>
    );
  }

  if ((!data.hasPairsToday || data.allPairsFinished) && data.nextDay) {
    return (
      <Section title={data.allPairsFinished ? 'Пары закончились · далее' : 'Сегодня пар нет · далее'}>
        <PairsCard
          pairs={data.nextDay.pairs}
          subtitle={`${data.nextDay.dayName}, ${formatDate(data.nextDay.date)}`}
          showCurrentPair={false}
        />
      </Section>
    );
  }

  return (
    <Section title="Расписание">
      <PairsCard
        pairs={data.todayPairs}
        subtitle={`${data.todayPairs.length} ${pluralPairs(data.todayPairs.length)} сегодня`}
        showCurrentPair={true}
      />
    </Section>
  );
}

// ============================================================
// Основная карточка
// ============================================================

function PairsCard({
  pairs,
  subtitle,
  showCurrentPair,
}: {
  pairs: DaySlot[];
  subtitle: string;
  showCurrentPair: boolean;
}) {
  const navigate = useNavigate();
  const currentMinutes = useCurrentMinutes();

  // Определяем текущую пару
  let currentIndex = -1;
  if (showCurrentPair) {
    currentIndex = pairs.findIndex((slot) => {
      const [sh, sm] = slot.startTime.split(':').map(Number);
      const [eh, em] = slot.endTime.split(':').map(Number);
      return currentMinutes >= sh * 60 + sm && currentMinutes <= eh * 60 + em;
    });
  }

  const currentSlot = currentIndex >= 0 ? pairs[currentIndex] : null;
  const nextSlot = currentIndex >= 0 ? pairs[currentIndex + 1] ?? null : null;

  // Вычисляем прогресс текущей пары
  let progressPercent = 0;
  let remainingMinutes = 0;
  let breakMinutes: number | null = null;

  if (currentSlot) {
    const [sh, sm] = currentSlot.startTime.split(':').map(Number);
    const [eh, em] = currentSlot.endTime.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    const total = endMin - startMin;
    const elapsed = currentMinutes - startMin;
    remainingMinutes = endMin - currentMinutes;
    progressPercent = Math.round((elapsed / total) * 100);

    if (nextSlot) {
      const [nsh, nsm] = nextSlot.startTime.split(':').map(Number);
      breakMinutes = (nsh * 60 + nsm) - endMin;
    }
  }

  return (
    <div
      className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-transparent overflow-hidden cursor-pointer
                 active:bg-neutral-50 dark:active:bg-neutral-800 transition-colors"
      onClick={() => navigate('/schedule')}
    >
      {/* Текущая пара — крупный блок */}
      {currentSlot?.pair && (
        <div className="p-4 pb-3 border-b border-gray-100 dark:border-neutral-800">
          <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 mb-1">
            Сейчас · {currentSlot.pairNumber} пара
          </p>

          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {currentSlot.pair.subjectName}
          </p>

          <div className="flex items-center gap-2 mt-1">
            {currentSlot.pair.teacherName && (
              <span className="text-sm text-neutral-600 dark:text-neutral-300">
                {currentSlot.pair.teacherName}
              </span>
            )}
            {currentSlot.pair.room && (
              <span className="text-sm text-neutral-400 dark:text-neutral-500 ml-auto">
                {currentSlot.pair.room === 'ДОТ' ? 'ДОТ' : `ауд. ${currentSlot.pair.room}`}
              </span>
            )}
          </div>

          {/* Оставшееся время */}
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
            Осталось {remainingMinutes} мин · до {currentSlot.endTime}
          </p>

          {/* Прогресс-бар */}
          <div className="mt-2 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Следующая пара */}
          {nextSlot?.pair && breakMinutes !== null && (
            <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-2">
              Далее: {nextSlot.pair.subjectName} · перерыв {breakMinutes} мин
            </p>
          )}
        </div>
      )}

      {/* Список пар */}
      <div className="px-4 py-2">
        {!currentSlot && (
          <p className="text-xs font-medium text-neutral-400 dark:text-neutral-500 mb-1 pt-1">
            {subtitle}
          </p>
        )}

        {pairs.map((slot, i) => {
          const isPast = showCurrentPair && currentIndex >= 0 && i < currentIndex;
          const isCurrent = showCurrentPair && i === currentIndex;

          return (
            <CompactPairRow
              key={slot.pairNumber}
              slot={slot}
              isPast={isPast}
              isCurrent={isCurrent}
            />
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Компактная строка пары
// ============================================================

function CompactPairRow({
  slot,
  isPast,
  isCurrent,
}: {
  slot: DaySlot;
  isPast: boolean;
  isCurrent: boolean;
}) {
  if (!slot.pair) return null;
  const pair = slot.pair;
  const isCancelled = pair.status === 'cancelled';
  const isEvent = pair.status === 'event';

  const badge = isEvent && pair.eventType
    ? EVENT_BADGE[pair.eventType] ?? EVENT_BADGE.other
    : pair.entryType
      ? TYPE_BADGE[pair.entryType] ?? TYPE_BADGE.other
      : null;

  return (
    <div
      className={`
        flex items-center gap-2 py-2
        ${isCancelled ? 'opacity-40' : ''}
        ${isPast ? 'opacity-30' : ''}
        ${isCurrent ? 'opacity-50' : ''}
      `}
    >
      {/* Номер */}
      <span className="text-sm text-neutral-400 dark:text-neutral-500 w-5 shrink-0 tabular-nums">
        {slot.pairNumber}
      </span>

      {/* Бейдж */}
      {badge && (
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${badge.className}`}>
          {badge.label}
        </span>
      )}

      {/* Название */}
      <span
        className={`text-sm flex-1 truncate ${
          isCancelled
            ? 'line-through text-neutral-400 dark:text-neutral-500'
            : 'text-neutral-800 dark:text-neutral-200'
        }`}
      >
        {pair.subjectName}
      </span>

      {/* Аудитория */}
      {!isCancelled && pair.room && (
        <span className="text-sm text-neutral-400 dark:text-neutral-500 shrink-0">
          {pair.room === 'ДОТ' ? 'ДОТ' : pair.room}
        </span>
      )}

      {/* Отмена */}
      {isCancelled && (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 shrink-0">
          Отм.
        </span>
      )}
    </div>
  );
}

// ============================================================
// Утилиты
// ============================================================

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2 px-1">
        {title}
      </h3>
      {children}
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-transparent">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{text}</p>
    </div>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
  }).format(date);
}

function pluralPairs(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'пара';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'пары';
  return 'пар';
}