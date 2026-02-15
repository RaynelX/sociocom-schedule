import { useSetPageHeader } from "../providers/PageHeaderProvider";

export function SubjectsPage() {
  useSetPageHeader({title: 'Предемты'});

  return (
    <div className="p-4">
      <p className="text-gray-500 mt-2">Список предметов появится здесь</p>
    </div>
  );
}