'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ScheduleItem, ScheduleDetail } from '@/lib/scheduleService';

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
]; // Очень мудрая умная сложная реализация, я знаю, похлопайте мне

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [bells, setBells] = useState<Bell[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // === РЕЖИМ ФОРМЫ ===
  // false = Одна пара для всей группы
  // true = Пара разбита на подгруппы
  const [isSubgroupMode, setIsSubgroupMode] = useState(false);

  // Основная форма
  const [formData, setFormData] = useState({
    subject: '',
    type: 'lecture',
    day_of_week: 1,
    pair_number: 1,
    start_date: new Date().toISOString().split('T')[0], // Вернули start_date
    end_date: '2025-12-31',
    simple_room: '',
    simple_teacher: ''
  });

  const [details, setDetails] = useState<ScheduleDetail[]>([
    { subgroup: '', teacher: '', room: '' },
    { subgroup: '', teacher: '', room: '' }
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: bellsData } = await supabase.from('bell_schedule').select('*').order('pair_number');
    if (bellsData) setBells(bellsData);

    const { data: scheduleData } = await supabase.from('schedule_items').select('*').order('day_of_week').order('pair_number');
    if (scheduleData) setItems(scheduleData);
    
    setLoading(false);
  };

  const addDetailRow = () => {
    setDetails([...details, { subgroup: '', teacher: '', room: '' }]);
  };

  const removeDetailRow = (index: number) => {
    if (details.length === 1) return;
    setDetails(details.filter((_, i) => i !== index));
  };

  const updateDetail = (index: number, field: keyof ScheduleDetail, value: string) => {
    const newDetails = [...details];
    newDetails[index][field] = value;
    setDetails(newDetails);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Формируем финальный JSON в зависимости от режима
    let finalDetails: ScheduleDetail[] = [];

    if (isSubgroupMode) {
        // Режим подгрупп: берем массив details, фильтруем пустые строки
        finalDetails = details.filter(d => d.subgroup.trim() !== '');
        if (finalDetails.length === 0) {
            alert("Укажите хотя бы одну подгруппу");
            return;
        }
    } else {
        // Режим всей группы: создаем одну запись с пустым subgroup
        finalDetails = [{
            subgroup: '', // Пусто = вся группа
            room: formData.simple_room,
            teacher: formData.simple_teacher
        }];
    }

    const payload = {
        subject: formData.subject,
        type: formData.type,
        day_of_week: formData.day_of_week,
        pair_number: formData.pair_number,
        start_date: formData.start_date,
        end_date: formData.end_date,
        details: finalDetails
    };

    const { error } = await supabase.from('schedule_items').insert([payload]);

    if (error) {
      alert('Ошибка: ' + error.message);
    } else {
      // Сброс формы (оставляем даты и день для удобства массового ввода)
      setFormData({ ...formData, subject: '', simple_room: '', simple_teacher: '' });
      setDetails([{ subgroup: '', teacher: '', room: '' }, { subgroup: '', teacher: '', room: '' }]);
      fetchData();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить занятие?')) return;
    await supabase.from('schedule_items').delete().eq('id', id);
    fetchData();
  };

  if (loading) return <div className="p-10">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
      
      {/* Toast */}
      <div className={`fixed bottom-5 right-5 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg transition-all z-50 ${showSuccess ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
        ✅ Занятие добавлено!
      </div>

      <header className="bg-white border-b border-gray-200 p-4 mb-6 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">🛠 Админка</h1>
          <div className="flex gap-4">
            <Link href="/" className="text-blue-600 hover:underline text-sm flex items-center">На сайт ↗</Link>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="text-red-600 text-sm">Выйти</button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ФОРМА ДОБАВЛЕНИЯ ПАРЫ */}
        <div className="lg:col-span-5">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 sticky top-24">
            <h2 className="text-lg font-bold mb-4">Новое занятие</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* База */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Название предмета</label>
                  <input required type="text" placeholder="Например: Высшая математика" className="w-full border border-gray-300 h-10 px-3 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">День</label>
                        <select className="w-full border border-gray-300 h-10 px-2 rounded bg-white text-sm"
                            value={formData.day_of_week} onChange={e => setFormData({...formData, day_of_week: Number(e.target.value)})}>
                            {DAYS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Пара</label>
                        <select className="w-full border border-gray-300 h-10 px-2 rounded bg-white text-sm"
                            value={formData.pair_number} onChange={e => setFormData({...formData, pair_number: Number(e.target.value)})}>
                            {bells.map(b => <option key={b.pair_number} value={b.pair_number}>{b.pair_number} ({b.start_time.slice(0,5)})</option>)}
                        </select>
                    </div>
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Тип</label>
                        <select className="w-full border border-gray-300 h-10 px-2 rounded bg-white text-sm"
                            value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                            <option value="lecture">Лекция</option>
                            <option value="seminar">Семинар</option>
                            <option value="lab">Практика</option>
                            <option value="other">Другое</option>
                        </select>
                    </div>
                </div>

                {/* Промежуток (что?) пар */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Дата начала</label>
                        <input type="date" required className="w-full border border-gray-300 h-10 px-2 rounded text-sm uppercase"
                            value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Дата конца</label>
                        <input type="date" required className="w-full border border-gray-300 h-10 px-2 rounded text-sm uppercase"
                            value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                    </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Переключение видов вся группа / Подгруппы */}
              <div>
                <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
                    <button 
                        type="button"
                        onClick={() => setIsSubgroupMode(false)}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${!isSubgroupMode ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Вся группа
                    </button>
                    <button 
                        type="button"
                        onClick={() => setIsSubgroupMode(true)}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${isSubgroupMode ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        По подгруппам
                    </button>
                </div>

                {/* Вся группа */}
                {!isSubgroupMode && (
                    <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Аудитория</label>
                            <input type="text" placeholder="305-а" className="w-full border border-gray-300 h-10 px-3 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.simple_room} onChange={e => setFormData({...formData, simple_room: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Преподаватель</label>
                            <input type="text" placeholder="Иванов И.И." className="w-full border border-gray-300 h-10 px-3 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.simple_teacher} onChange={e => setFormData({...formData, simple_teacher: e.target.value})} />
                        </div>
                    </div>
                )}

                {/* По подгруппам */}
                {isSubgroupMode && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                         {details.map((detail, index) => (
                            <div key={index} className="flex gap-2 items-start">
                                <div className="grid grid-cols-3 gap-2 flex-1">
                                    <div className="col-span-1">
                                        {index === 0 && <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Группа</label>}
                                        <input type="text" placeholder="Напр. 81а" className="border border-gray-300 h-9 rounded px-2 text-sm w-full"
                                            value={detail.subgroup} onChange={e => updateDetail(index, 'subgroup', e.target.value)} />
                                    </div>
                                    <div className="col-span-1">
                                        {index === 0 && <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Аудитория</label>}
                                        <input type="text" placeholder="Ауд." className="border border-gray-300 h-9 rounded px-2 text-sm w-full"
                                            value={detail.room} onChange={e => updateDetail(index, 'room', e.target.value)} />
                                    </div>
                                    <div className="col-span-1">
                                        {index === 0 && <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Преподаватель</label>}
                                        <input type="text" placeholder="Фамилия" className="border border-gray-300 h-9 rounded px-2 text-sm w-full"
                                            value={detail.teacher} onChange={e => updateDetail(index, 'teacher', e.target.value)} />
                                    </div>
                                </div>
                                <div className={`${index === 0 ? 'mt-6' : 'mt-0'}`}>
                                    <button type="button" onClick={() => removeDetailRow(index)} className="text-gray-400 hover:text-red-500 h-9 w-8 flex items-center justify-center transition">✕</button>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addDetailRow} className="text-sm text-blue-600 font-medium hover:underline pl-1">
                            + Добавить ещё подгруппу
                        </button>
                    </div>
                )}
              </div>

              <div className="pt-4">
                  <button type="submit" className="w-full bg-blue-600 text-white h-11 rounded-lg font-bold hover:bg-blue-700 shadow-sm transition transform active:scale-[0.99]">
                    Сохранить в расписание
                  </button>
              </div>
            </form>
          </div>
        </div>

        {/* СПИСОК */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-lg font-bold text-gray-800 px-1">Текущее расписание ({items.length})</h2>
          
          {items.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-start group hover:shadow-md transition">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                     <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.day_of_week > 5 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                      {DAYS.find(d => d.id === item.day_of_week)?.name}
                    </span>
                    <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded">
                      {item.pair_number} пара
                    </span>
                    <span className="text-xs text-gray-400 border border-gray-100 px-1 rounded">
                       {new Date(item.start_date).toLocaleDateString()} — {new Date(item.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-gray-900 text-lg">{item.subject} <span className="text-sm font-normal text-gray-500">({item.type})</span></h3>
                  
                  {/* Логика отображения в списке админки */}
                  <div className="mt-2 space-y-1">
                    {/* Если только одна деталь */}
                    {item.details.length === 1 && !item.details[0].subgroup ? (
                         <p className="text-sm text-gray-600">
                             {item.details[0].room || 'Ауд. не указана'} <span className="mx-2 text-gray-300">|</span> {item.details[0].teacher || 'Преп. не указан'}
                         </p>
                    ) : (
                        // Иначе рисуем список подгрупп
                        item.details.map((d, i) => (
                            <div key={i} className="text-sm flex gap-2 text-gray-700 border-l-2 border-purple-100 pl-2">
                                <span className="font-bold w-16 text-xs uppercase bg-purple-50 px-1 py-0.5 rounded text-purple-700 truncate">{d.subgroup}</span>
                                <span className="w-16 truncate text-gray-900">{d.room || '—'}</span>
                                <span className="flex-1 text-gray-500 truncate">{d.teacher || '—'}</span>
                            </div>
                        ))
                    )}
                  </div>
                </div>
                
                <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-600 p-2 transition">
                  Удалить
                </button>
              </div>
          ))}
          {items.length === 0 && <div className="text-center py-10 text-gray-400">Список пуст</div>}
        </div>

      </div>
    </div>
  );
}