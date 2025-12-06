'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ScheduleItem } from '@/lib/scheduleService';
import CourseWizard from './CourseWizard';
import CourseRescheduler from './CourseRescheduler';

// --- ИКОНКИ ---
const IconTrash = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>);
const IconEdit = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>);
const IconCheck = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>);

const DAYS = [
  { id: 1, name: 'Понедельник' }, { id: 2, name: 'Вторник' }, { id: 3, name: 'Среда' },
  { id: 4, name: 'Четверг' }, { id: 5, name: 'Пятница' }, { id: 6, name: 'Суббота' },
]; // Лучшее, что я делал

const TYPE_LABELS: Record<string, string> = {
    lecture: 'Лекция', seminar: 'Семинар', lab: 'Практика', other: 'Другое'
};

const formatDateShort = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}; // Даты

export default function ScheduleTab() {
  const [loading, setLoading] = useState(true);              // Загрузка
  const [items, setItems] = useState<ScheduleItem[]>([]);    // Пары
  const [bells, setBells] = useState<any[]>([]);             // Звонки
  const [subjects, setSubjects] = useState<any[]>([]);       // Дисциплины
  const [showSuccess, setShowSuccess] = useState(false);     // Плашка
  
  // Состояния режимов и модалок
  const [viewMode, setViewMode] = useState<'days' | 'courses'>('days');
  const [showEnded, setShowEnded] = useState(false); // Фильтр "Показать архивные"
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [reschedulingSubject, setReschedulingSubject] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: b } = await supabase.from('bell_schedule').select('*').order('pair_number');
    if (b) setBells(b);
    const { data: s } = await supabase.from('schedule_items').select('*').order('day_of_week').order('pair_number');
    if (s) setItems(s);
    const { data: sub } = await supabase.from('subjects').select('*').order('name');
    if (sub) setSubjects(sub);
    setLoading(false);
  };

  // --- ЛОГИКА ОТОБРАЖЕНИЯ (ФИЛЬТРЫ) ---
  const todayStr = new Date().toISOString().split('T')[0];
  const displayedItems = items.filter(item => {
      if (showEnded) return true;
      return item.end_date >= todayStr;
  });
  const activeSubjects = Array.from(new Set(items.map(i => i.subject))).sort();

  // --- ЛОГИКА РЕДАКТИРОВАНИЯ ---
  const handleEditClick = (item: ScheduleItem) => {
    setEditingItem(JSON.parse(JSON.stringify(item)));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const { error } = await supabase
      .from('schedule_items')
      .update({
        subject: editingItem.subject,
        type: editingItem.type,
        start_date: editingItem.start_date,
        end_date: editingItem.end_date,
        details: editingItem.details 
      })
      .eq('id', editingItem.id);

    if (error) alert(error.message);
    else {
      setEditingItem(null);
      fetchData();
      setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить занятие?')) return;
    await supabase.from('schedule_items').delete().eq('id', id);
    fetchData();
  };

  // Методы управления деталями в модалке
  const editDetail = (idx: number, field: string, val: string) => {
      if(!editingItem) return;
      const newDetails = [...editingItem.details];
      newDetails[idx] = { ...newDetails[idx], [field]: val };
      setEditingItem({...editingItem, details: newDetails});
  };
  const addDetailToEdit = () => {
      if(!editingItem) return;
      setEditingItem({...editingItem, details: [...editingItem.details, { subgroup: '', room: '', teacher: '' }]});
  }
  const removeDetailFromEdit = (idx: number) => {
      if(!editingItem || editingItem.details.length === 1) return;
      setEditingItem({...editingItem, details: editingItem.details.filter((_, i) => i !== idx)});
  }

  if (loading) return <div className="p-10 text-gray-500">Загрузка расписания...</div>;

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className={`fixed bottom-5 right-5 bg-green-600 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 transition-all z-50 ${showSuccess ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
        <span className="text-white"><IconCheck /></span>
        <span className="font-bold">Сохранено</span>
      </div>

      <CourseWizard subjects={subjects} bells={bells} onSuccess={() => {
          fetchData();
          setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000);
      }} />

      <div className="mt-12">
        {/* ЗАГОЛОВОК И ФИЛЬТРЫ */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-2 gap-4">
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-gray-800 px-1">Просмотр расписания</h2>
                
                <label className="flex items-center gap-2 cursor-pointer select-none bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
                    <input 
                        type="checkbox" 
                        checked={showEnded} 
                        onChange={e => setShowEnded(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-gray-600">Показать архивные</span>
                </label>
            </div>

            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button onClick={() => setViewMode('days')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${viewMode === 'days' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>По дням</button>
                <button onClick={() => setViewMode('courses')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${viewMode === 'courses' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>По курсам</button>
            </div>
        </div>
        
        {/* ВИД 1: ПО ДНЯМ */}
        {viewMode === 'days' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {DAYS.map(day => {
                    const dayItems = displayedItems.filter(i => i.day_of_week === day.id);
                    if (dayItems.length === 0) return null;

                    return (
                        <div key={day.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit flex flex-col">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-bold text-gray-700 uppercase text-xs tracking-wider flex justify-between">
                                {day.name} <span className="text-gray-400 font-normal">{dayItems.length} пар</span>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {dayItems.map(item => {
                                    const bell = bells.find(b => b.pair_number === item.pair_number);
                                    
                                    return (
                                    <div key={item.id} className="p-4 hover:bg-blue-50 transition group relative">
                                        <div className="flex gap-4 mb-3">
                                            {/* Номер и Время */}
                                            <div className="flex flex-col items-center min-w-[2.5rem]">
                                                <span className="text-xl font-bold text-blue-600 leading-none">{item.pair_number}</span>
                                                {bell && <span className="text-[10px] text-gray-400 font-medium mt-1">{bell.start_time.slice(0,5)}</span>}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-sm font-bold text-gray-900 leading-tight break-words">{item.subject}</div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wide bg-gray-100 px-1.5 rounded border border-gray-200">
                                                            {TYPE_LABELS[item.type] || item.type}
                                                        </span>
                                                        <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-1 rounded">
                                                            {formatDateShort(item.start_date)} — {formatDateShort(item.end_date)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pl-12 space-y-2">
                                            {item.details.map((d, i) => (
                                                <div key={i} className="text-sm flex flex-wrap gap-x-2 gap-y-1 items-center text-gray-700 bg-gray-50/50 rounded p-1.5 border border-gray-100">
                                                    {d.subgroup && <span className="font-bold px-1.5 py-0.5 rounded text-[10px] uppercase bg-purple-100 text-purple-700">{d.subgroup}</span>}
                                                    <span className="font-medium text-gray-900 bg-white px-1.5 rounded text-xs border border-gray-200">{d.room || '—'}</span>
                                                    <span className="text-xs text-gray-500 truncate">{d.teacher}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition bg-white/90 backdrop-blur rounded-lg p-1 shadow-sm border border-gray-100">
                                            <button onClick={() => handleEditClick(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><IconEdit /></button>
                                            <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><IconTrash /></button>
                                        </div>
                                    </div>
                                )})}
                            </div>
                        </div>
                    )
                })}
            </div>
        )}

        {/* ВИД 2: ПО КУРСАМ */}
        {viewMode === 'courses' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSubjects.map(subName => {
                    const subItems = items.filter(i => i.subject === subName);
                    const lastDate = subItems.reduce((max, i) => i.end_date > max ? i.end_date : max, '0000-00-00');

                    return (
                        <div key={subName} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-gray-900">{subName}</h3>
                                <p className="text-xs text-gray-500 mt-1">Активен до: <span className="font-bold text-gray-700">{formatDateShort(lastDate)}</span></p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {subItems.map(i => (
                                        <span key={i.id} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 border border-gray-200">
                                            {DAYS[i.day_of_week-1].name.slice(0,2)} {i.pair_number}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => setReschedulingSubject(subName)} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-100 border border-blue-200">Перестроить</button>
                        </div>
                    );
                })}
            </div>
        )}
        
        {items.length === 0 && <div className="text-center py-20 text-gray-400">Список занятий пуст</div>}
      </div>

      {/* МОДАЛКА РЕСТРУКТУРИЗАЦИИ */}
      {reschedulingSubject && (
          <CourseRescheduler 
            subjectName={reschedulingSubject} 
            bells={bells}
            onClose={() => setReschedulingSubject(null)}
            onSuccess={() => { setReschedulingSubject(null); fetchData(); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000); }}
          />
      )}

      {/* МОДАЛКА РЕДАКТИРОВАНИЯ (Чистая) */}
      {editingItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 my-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Редактировать занятие</h3>
                    <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-600"><IconTrash /></button>
                  </div>
                  
                  <form onSubmit={handleSaveEdit} className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Предмет</label>
                            <select className="w-full border border-gray-300 h-9 px-2 rounded text-sm" value={editingItem.subject} onChange={e => setEditingItem({...editingItem, subject: e.target.value})}>
                                {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Тип</label>
                            <select className="w-full border border-gray-300 h-9 px-2 rounded text-sm" value={editingItem.type} onChange={e => setEditingItem({...editingItem, type: e.target.value})}>
                                <option value="lecture">Лекция</option><option value="seminar">Семинар</option><option value="lab">Прак.</option><option value="other">Другое</option>
                            </select>
                        </div>
                      </div>

                      <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Период действия</label>
                          <div className="flex gap-2 items-center">
                              <input type="date" className="border border-gray-300 h-9 px-2 rounded text-sm flex-1" value={editingItem.start_date} onChange={e => setEditingItem({...editingItem, start_date: e.target.value})} />
                              <span className="text-gray-400">—</span>
                              <input type="date" className="border border-gray-300 h-9 px-2 rounded text-sm flex-1" value={editingItem.end_date} onChange={e => setEditingItem({...editingItem, end_date: e.target.value})} />
                          </div>
                      </div>
                      
                      <div>
                          <div className="flex justify-between items-end mb-2">
                             <label className="text-[10px] font-bold text-gray-500 uppercase block">Подгруппы</label>
                             <button type="button" onClick={addDetailToEdit} className="text-[10px] text-blue-600 font-bold hover:underline bg-blue-50 px-2 py-1 rounded">+ Добавить</button>
                          </div>
                          <div className="space-y-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                              {editingItem.details.map((detail, idx) => (
                                  <div key={idx} className="flex gap-2 items-center w-full">
                                      <input type="text" placeholder="Гр." className="w-14 shrink-0 border border-gray-300 h-8 px-2 rounded text-sm text-center placeholder:text-gray-400" value={detail.subgroup} onChange={e => editDetail(idx, 'subgroup', e.target.value)} />
                                      <input type="text" placeholder="Ауд." className="w-16 shrink-0 border border-gray-300 h-8 px-2 rounded text-sm text-center placeholder:text-gray-400" value={detail.room} onChange={e => editDetail(idx, 'room', e.target.value)} />
                                      <input type="text" placeholder="Преподаватель" className="flex-1 border border-gray-300 h-8 px-2 rounded text-sm placeholder:text-gray-400" value={detail.teacher} onChange={e => editDetail(idx, 'teacher', e.target.value)} />
                                      {editingItem.details.length > 1 && <button type="button" onClick={() => removeDetailFromEdit(idx)} className="text-red-400 hover:text-red-600 px-1 font-bold">✕</button>}
                                  </div>
                              ))}
                          </div>
                      </div>
                      
                      <div className="flex gap-3 mt-6 pt-4 border-t">
                          <button type="button" onClick={() => setEditingItem(null)} className="flex-1 h-10 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition">Отмена</button>
                          <button type="submit" className="flex-1 h-10 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-md">Сохранить</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}