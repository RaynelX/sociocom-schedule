'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Типы
type ScheduleItem = {
  id: number;
  subject: string;
  type: string;
  day_of_week: number;
  pair_number: number;
  room: string;
  teacher: string;
  start_date: string;
  end_date: string;
  subgroup: string | null; // Добавили подгруппу
};

type Bell = {
  pair_number: number;
  start_time: string;
  end_time: string;
};

const DAYS = [
  { id: 1, name: 'Понедельник' },
  { id: 2, name: 'Вторник' },
  { id: 3, name: 'Среда' },
  { id: 4, name: 'Четверг' },
  { id: 5, name: 'Пятница' },
  { id: 6, name: 'Суббота' },
];

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [bells, setBells] = useState<Bell[]>([]);
  
  // Состояние для уведомления
  const [showSuccess, setShowSuccess] = useState(false);

  // Состояние формы
  const [formData, setFormData] = useState({
    subject: '',
    type: 'lecture',
    day_of_week: 1,
    pair_number: 1,
    room: '',
    teacher: '',
    subgroup: '', // Пустая строка = Вся группа
    start_date: new Date().toISOString().split('T')[0],
    end_date: '2025-12-31',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: bellsData } = await supabase.from('bell_schedule').select('*').order('pair_number');
    if (bellsData) setBells(bellsData);

    const { data: scheduleData } = await supabase
      .from('schedule_items')
      .select('*')
      .order('day_of_week')
      .order('pair_number');

    if (scheduleData) setItems(scheduleData);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Преобразуем пустую строку подгруппы в null для базы
    const payload = {
        ...formData,
        subgroup: formData.subgroup === '' ? null : formData.subgroup
    };

    const { error } = await supabase.from('schedule_items').insert([payload]);

    if (error) {
      alert('Ошибка: ' + error.message);
    } else {
      setFormData({ ...formData, subject: '', room: '', teacher: '' }); // Сброс полей
      fetchData(); // Обновление списка
      
      // Показываем уведомление на 3 секунды
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Точно удалить этот предмет?')) return;
    const { error } = await supabase.from('schedule_items').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchData();
  };

  if (loading) return <div className="p-10">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
      
      {/* УВЕДОМЛЕНИЕ (Toast) */}
      <div className={`fixed bottom-5 right-5 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 z-50 ${showSuccess ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
        ✅ Успешно добавлено!
      </div>

      <header className="bg-white border-b border-gray-200 p-4 mb-6 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">🛠 Админка расписания</h1>
          <div className="flex gap-4">
            <Link href="/" className="text-blue-600 hover:underline text-sm flex items-center">
              Открыть сайт ↗
            </Link>
            <button 
              onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
              className="text-red-600 text-sm hover:text-red-800"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* ФОРМА */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow sticky top-24">
            <h2 className="text-lg font-bold mb-4">Добавить предмет</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Название предмета</label>
                <input 
                  type="text" required placeholder="Например: Математика"
                  className="w-full border border-gray-300 h-10 px-3 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">День</label>
                  <select 
                    className="w-full border border-gray-300 h-10 px-2 rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.day_of_week}
                    onChange={e => setFormData({...formData, day_of_week: Number(e.target.value)})}
                  >
                    {DAYS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Пара</label>
                  <select 
                    className="w-full border border-gray-300 h-10 px-2 rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.pair_number}
                    onChange={e => setFormData({...formData, pair_number: Number(e.target.value)})}
                  >
                    {bells.map(b => (
                      <option key={b.pair_number} value={b.pair_number}>
                        {b.pair_number} ({b.start_time.slice(0,5)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Тип</label>
                  <select 
                    className="w-full border border-gray-300 h-10 px-2 rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="lecture">Лекция</option>
                    <option value="seminar">Семинар</option>
                    <option value="lab">Лаба</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Аудитория</label>
                  <input 
                    type="text" placeholder="305-а"
                    className="w-full border border-gray-300 h-10 px-3 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.room}
                    onChange={e => setFormData({...formData, room: e.target.value})}
                  />
                </div>
              </div>

              {/* НОВОЕ ПОЛЕ: ПОДГРУППА */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Подгруппа</label>
                <select 
                   className="w-full border border-gray-300 h-10 px-2 rounded bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                   value={formData.subgroup}
                   onChange={e => setFormData({...formData, subgroup: e.target.value})}
                >
                  <option value="">Для всей группы</option>
                  <option value="1">1 подгруппа</option>
                  <option value="2">2 подгруппа</option>
                  {/* Можешь добавить сюда свои варианты, например: */}
                  {/* <option value="eng_beg">Англ (начинающие)</option> */}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Преподаватель</label>
                <input 
                  type="text" placeholder="Иванов И.И."
                  className="w-full border border-gray-300 h-10 px-3 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.teacher}
                  onChange={e => setFormData({...formData, teacher: e.target.value})}
                />
              </div>

              <div className="pt-2 border-t mt-2">
                <p className="text-xs text-gray-400 mb-1">Период действия:</p>
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="date" required
                    className="w-full border border-gray-300 h-10 px-2 rounded text-sm outline-none"
                    value={formData.start_date}
                    onChange={e => setFormData({...formData, start_date: e.target.value})}
                  />
                  <input 
                    type="date" required
                    className="w-full border border-gray-300 h-10 px-2 rounded text-sm outline-none"
                    value={formData.end_date}
                    onChange={e => setFormData({...formData, end_date: e.target.value})}
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white h-10 rounded font-bold hover:bg-blue-700 mt-2 transition shadow-md hover:shadow-lg">
                Сохранить
              </button>
            </form>
          </div>
        </div>

        {/* СПИСОК ПАР */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Все занятия в базе ({items.length})</h2>
            
            {items.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-center group hover:shadow-md transition">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded">
                      {DAYS.find(d => d.id === item.day_of_week)?.name}
                    </span>
                    <span className="text-gray-500 text-sm font-medium">
                      {item.pair_number}-я пара
                    </span>
                    {/* Бейдж подгруппы в списке */}
                    {item.subgroup && (
                         <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-0.5 rounded border border-purple-200">
                           {item.subgroup === '1' ? '1-я подгруппа' : item.subgroup === '2' ? '2-я подгруппа' : item.subgroup}
                         </span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg leading-tight">
                    {item.subject} 
                    <span className="text-gray-400 font-normal text-sm ml-2">{item.type}</span>
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.teacher} • <span className="text-gray-700 font-medium">{item.room}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(item.start_date).toLocaleDateString()} — {new Date(item.end_date).toLocaleDateString()}
                  </p>
                </div>
                
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="bg-red-50 text-red-600 px-4 py-2 rounded text-sm opacity-0 group-hover:opacity-100 transition hover:bg-red-600 hover:text-white"
                >
                  Удалить
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}