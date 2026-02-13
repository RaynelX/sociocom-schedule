import { useDatabase } from '../providers/DatabaseProvider';
import { useSync } from '../../database/sync/SyncProvider';
import { useRxCollection } from '../../database/hooks/use-rx-collection';

export function TodayPage() {
  const db = useDatabase();
  const { status, triggerSync } = useSync();

  const { data: subjects, loading: subjectsLoading } = useRxCollection(db.subjects);
  const { data: teachers, loading: teachersLoading } = useRxCollection(db.teachers);
  const { data: schedule, loading: scheduleLoading } = useRxCollection(db.schedule);
  const { data: events }  = useRxCollection(db.events);
  const { data: students } = useRxCollection(db.students);

  const isLoading = subjectsLoading || teachersLoading || scheduleLoading;

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Сегодня</h2>
        <p className="text-sm text-gray-500 mt-1">
          Статус: {status.state}
          {status.error && <span className="text-red-500"> — {status.error}</span>}
        </p>
      </div>

      {/* Статистика синхронизации */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Предметы" count={subjects.length} loading={isLoading} />
        <StatCard label="Преподаватели" count={teachers.length} loading={isLoading} />
        <StatCard label="Записи расписания" count={schedule.length} loading={isLoading} />
        <StatCard label="События" count={events.length} loading={isLoading} />
        <StatCard label="Студенты" count={students.length} loading={isLoading} />
      </div>

      {/* Список предметов — доказательство работы sync */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Предметы</h3>
        {subjects.length === 0 ? (
          <p className="text-sm text-gray-400">
            {isLoading ? 'Загрузка...' : 'Нет данных. Добавьте предметы в Supabase.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {subjects.map((s) => (
              <li
                key={s.id}
                className="p-3 bg-white rounded-lg border border-gray-200"
              >
                <p className="font-medium text-gray-900">{s.name}</p>
                {s.short_name && (
                  <p className="text-sm text-gray-500">{s.short_name}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Кнопка принудительной синхронизации */}
      <button
        onClick={triggerSync}
        className="w-full py-2.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg active:bg-blue-100 transition-colors"
      >
        Синхронизировать вручную
      </button>
    </div>
  );
}

function StatCard({
  label,
  count,
  loading,
}: {
  label: string;
  count: number;
  loading: boolean;
}) {
  return (
    <div className="p-3 bg-white rounded-lg border border-gray-200">
      <p className="text-2xl font-bold text-gray-900">
        {loading ? '—' : count}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}