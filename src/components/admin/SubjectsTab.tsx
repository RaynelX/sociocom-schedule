'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// SVG Иконки
const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
);
const IconPlus = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
);

type Subject = {
    id: number;
    name: string;
}

export default function SubjectsTab() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('*').order('name');
    if (data) setSubjects(data);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const { error } = await supabase.from('subjects').insert([{ name: newName.trim() }]);
    if (error) {
        alert('Ошибка: ' + error.message);
    } else {
        setNewName('');
        fetchSubjects();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этот предмет из списка? (В расписании он останется как текст)')) return;
    await supabase.from('subjects').delete().eq('id', id);
    fetchSubjects();
  };

  if (loading) return <div className="p-10">Загрузка...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
        
        {/* Форма добавления */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Добавить предмет</h2>
            <form onSubmit={handleAdd} className="flex gap-2">
                <input 
                    type="text" 
                    placeholder="Название (напр. Физика)" 
                    className="flex-1 border border-gray-300 h-11 px-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                />
                <button type="submit" className="bg-blue-600 text-white w-12 rounded-lg flex items-center justify-center hover:bg-blue-700 transition">
                    <IconPlus />
                </button>
            </form>
            <p className="text-xs text-gray-400 mt-2">
                Добавьте сюда все предметы семестра. Потом вы сможете выбирать их из списка при создании расписания.
            </p>
        </div>

        {/* Список */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Список предметов ({subjects.length})</h2>
            <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto pr-2">
                {subjects.map(sub => (
                    <div key={sub.id} className="py-3 flex justify-between items-center group">
                        <span className="font-medium text-gray-700">{sub.name}</span>
                        <button onClick={() => handleDelete(sub.id)} className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition">
                            <IconTrash />
                        </button>
                    </div>
                ))}
                {subjects.length === 0 && <div className="text-gray-400 text-center py-4">Список пуст</div>}
            </div>
        </div>
    </div>
  );
}