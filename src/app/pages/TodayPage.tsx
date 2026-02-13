import { useDatabase } from '../providers/DatabaseProvider';

export function TodayPage() {
  const db = useDatabase();

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-gray-900">Сегодня</h2>
      <p className="text-gray-500 mt-2">
        Коллекции в БД: {Object.keys(db.collections).join(', ')}
      </p>
    </div>
  );
}