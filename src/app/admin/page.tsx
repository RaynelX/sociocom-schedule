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

// SVG Иконки
const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

const IconClose = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [bells, setBells] = useState<Bell[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubgroupMode, setIsSubgroupMode] = useState(false);

  // Основная форма
  const [formData, setFormData] = useState({
    subject: '',
    type: 'lecture',
    day_of_week: 1,
    pair_number: 1,
    start_date: new Date().toISOString().split('T')[0],
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

  const resetForm = () => {
    setEditingId(null);
    setFormData({
        subject: '',
        type: 'lecture',
        day_of_week: 1,
        pair_number: 1,
        start_date: formData.start_date, 
        end_date: formData.end_date,
        simple_room: '',
        simple_teacher: ''
    });
    setDetails([{ subgroup: '', teacher: '', room: '' }, { subgroup: '', teacher: '', room: '' }]);
    setIsSubgroupMode(false);
  };

  const handleEdit = (item: ScheduleItem) => {
    setEditingId(item.id);
    setFormData({
        subject: item.subject,
        type: item.type,
        day_of_week: item.day_of_week,
        pair_number: item.pair_number,
        start_date: item.start_date,
        end_date: item.end_date,
        simple_room: '',
        simple_teacher: ''
    });

    if (item.details.length > 1 || (item.details[0] && item.details[0].subgroup)) {
        setIsSubgroupMode(true);
        setDetails(item.details);
    } else {
        setIsSubgroupMode(false);
        setFormData(prev => ({
            ...prev,
            simple_room: item.details[0]?.room || '',
            simple_teacher: item.details[0]?.teacher || ''
        }));
        setDetails([{ subgroup: '', teacher: '', room: '' }, { subgroup: '', teacher: '', room: '' }]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    
    let finalDetails: ScheduleDetail[] = [];

    if (isSubgroupMode) {
        finalDetails = details.filter(d => d.subgroup.trim() !== '');
        if (finalDetails.length === 0) {
            alert("Укажите хотя бы одну подгруппу");
            return;
        }
    } else {
        finalDetails = [{
            subgroup: '',
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

    let error;

    if (editingId) {
        const res = await supabase.from('schedule_items').update(payload).eq('id', editingId);
        error = res.error;
    } else {
        const res = await supabase.from('schedule_items').insert([payload]);
        error = res.error;
    }

    if (error) {
      alert('Ошибка: ' + error.message);
    } else {
      resetForm();
      fetchData();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить занятие?')) return;
    await supabase.from('schedule_items').delete().eq('id', id);
    if (editingId === id) resetForm();
    fetchData();
  };

  if (loading) return <div className="p-10">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
      
      {/* Toast */}
      <div className={`fixed bottom-5 right-5 bg-gray-900 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 transition-all z-50 ${showSuccess ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
        <span className="text-green-400"><IconCheck /></span>
        <span className="font-medium">Сохранено</span>
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
        
        {/* === ФОРМА === */}
        <div className="lg:col-span-5">
          <div className={`bg-white p-5 rounded-xl shadow-sm border sticky top-24 transition-colors ${editingId ? 'border-yellow-400 ring-1 ring-yellow-400' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">
                    {editingId ? `Редактирование` : 'Новое занятие'}
                </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              
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
                                    <button type="button" onClick={() => removeDetailRow(index)} className="text-gray-400 hover:text-red-500 h-9 w-8 flex items-center justify-center transition">
                                        <IconClose />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addDetailRow} className="text-sm text-blue-600 font-medium hover:underline pl-1">
                            + Добавить ещё подгруппу
                        </button>
                    </div>
                )}
              </div>

              <div className="pt-4 flex gap-3">
                  {editingId && (
                      <button type="button" onClick={resetForm} className="w-1/3 bg-gray-200 text-gray-700 h-11 rounded-lg font-bold hover:bg-gray-300 transition">
                          Отмена
                      </button>
                  )}
                  <button type="submit" className={`flex-1 h-11 rounded-lg font-bold text-white shadow-sm transition transform active:scale-[0.99] ${editingId ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {editingId ? 'Сохранить изменения' : 'Добавить в расписание'}
                  </button>
              </div>
            </form>
          </div>
        </div>

        {/* === СПИСОК === */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-lg font-bold text-gray-800 px-1">Текущее расписание ({items.length})</h2>
          
          {items.map(item => (
              <div key={item.id} className={`bg-white p-4 rounded-xl shadow-sm border flex justify-between items-start group hover:shadow-md transition ${editingId === item.id ? 'border-yellow-400 ring-1 ring-yellow-400 bg-yellow-50' : 'border-gray-200'}`}>
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
                  
                  <h3 className="font-bold text-gray-900 text-lg">{item.subject} <span className="text-sm font-normal text-gray-500">({item.type === 'lab' ? 'пр.' : item.type === 'other' ? 'др.' : item.type === 'lecture' ? 'л.' : 'сем.'})</span></h3>
                  
                  <div className="mt-2 space-y-1">
                    {item.details.length === 1 && !item.details[0].subgroup ? (
                         <p className="text-sm text-gray-600">
                             {item.details[0].room || '—'} <span className="mx-2 text-gray-300">|</span> {item.details[0].teacher || '—'}
                         </p>
                    ) : (
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
                
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => handleEdit(item)} className="bg-gray-100 text-gray-600 p-2 rounded hover:bg-yellow-100 hover:text-yellow-700 transition" title="Редактировать">
                        <IconEdit />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="bg-gray-100 text-gray-600 p-2 rounded hover:bg-red-100 hover:text-red-600 transition" title="Удалить">
                        <IconTrash />
                    </button>
                </div>
              </div>
          ))}
          {items.length === 0 && <div className="text-center py-10 text-gray-400">Список пуст</div>}
        </div>

      </div>
    </div>
  );
}