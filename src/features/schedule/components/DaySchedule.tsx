import type { DaySlot, FloatingEvent } from '../utils/schedule-builder';
import { PairCard, WindowCard, FloatingEventCard } from './PairCard';

interface Props {
  slots: DaySlot[];
  floatingEvents: FloatingEvent[];
  date: Date;
}

export function DaySchedule({ slots, floatingEvents, date }: Props) {
    // Находим диапазон непустых слотов
  const firstIdx = slots.findIndex((s) => s.pair !== null);
  const lastIdx = findLastIndex(slots, (s) => s.pair !== null);

  // Нет пар
  if (firstIdx === -1) {
    return (
      <div>
        {floatingEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-neutral-500">
            <p className="text-lg">Нет пар</p>
            <p className="text-sm mt-1">Свободный день</p>
          </div>
        ) : (
          <div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2.5">
              События дня
            </p>
            <div className="space-y-2.5">
              {floatingEvents.map((event, i) => (
                <FloatingEventCard key={i} {...event} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Показываем от первой до последней непустой пары
  const visibleSlots = slots.slice(firstIdx, lastIdx + 1);

  return (
    <div className="space-y-2.5">
      {visibleSlots.map((slot) =>
        slot.pair ? (
          <PairCard
            key={slot.pairNumber}
            pair={slot.pair}
            startTime={slot.startTime}
            endTime={slot.endTime}
            date={date}
          />
        ) : (
          <WindowCard
            key={slot.pairNumber}
            pairNumber={slot.pairNumber}
            startTime={slot.startTime}
            endTime={slot.endTime}
          />
        ),
      )}

      {floatingEvents.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2.5">
            События дня
          </p>
          <div className="space-y-2.5">
            {floatingEvents.map((event, i) => (
              <FloatingEventCard key={i} {...event} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Array.findLastIndex polyfill для максимальной совместимости.
 */
function findLastIndex<T>(arr: T[], predicate: (item: T) => boolean): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) return i;
  }
  return -1;
}