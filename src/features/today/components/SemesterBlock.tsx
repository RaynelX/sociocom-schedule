import type { SemesterProgress } from '../hooks/use-semester-progress';

interface Props {
  data: SemesterProgress;
}

export function SemesterBlock({ data }: Props) {
  if (data.loading) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-2 px-1">
        Семестр
      </h3>

      <div className="p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-transparent">
        <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
          {data.name}
        </p>

        <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
          {data.weekNumber}-я неделя · {data.parityLabel}
        </p>

        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${data.progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 w-10 text-right shrink-0 tabular-nums">
            {data.progressPercent}%
          </span>
        </div>

        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1.5">
          {data.daysLeft > 0
            ? `${data.daysLeft} ${pluralDays(data.daysLeft)} до конца семестра`
            : 'Семестр завершён'}
        </p>
      </div>
    </div>
  );
}

function pluralDays(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'день';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'дня';
  return 'дней';
}