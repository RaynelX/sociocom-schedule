import { useSetPageHeader } from "../providers/PageHeaderProvider";

export function MorePage() {
  useSetPageHeader({title: 'Ещё'});
  
  return (
    <div className="p-4">
      <p className="text-gray-500 mt-2">Дополнительные разделы появятся здесь</p>
    </div>
  );
}