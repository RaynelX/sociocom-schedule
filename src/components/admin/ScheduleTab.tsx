'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ScheduleItem } from '@/lib/scheduleService';
import CourseWizard from './CourseWizard';
import CourseRescheduler from './CourseRescheduler'; // <--- Импорт

// ... Иконки (оставь те же) ...
const IconEdit = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>);
const IconTrash = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>);
const IconCheck = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>);

const DAYS = [
  { id: 1, name: 'Понедельник' }, { id: 2, name: 'Вторник' }, { id: 3, name: 'Среда' },
  { id: 4, name: 'Четверг' }, { id: 5, name: 'Пятница' }, { id: 6, name: 'Суббота' },
];

const formatDateShort = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
};

export default function ScheduleTab() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [bells, setBells] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Режимы
  const [viewMode, setViewMode] = useState<'days' | 'courses'>('days');
  const [reschedulingSubject, setReschedulingSubject] = useState<string | null>(null); // Для модалки реструктуризации
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null); // Для обычной модалки

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const { data: b } = await supabase.from('bell_schedule').select('*').order('pair_number');
    if (b) setBells(b);
    const { data: s } = await supabase.from('schedule_items').select('*').order('day_of_week').order('pair_number');
    if (s) setItems(s);
    const { data: sub } = await supabase.from('subjects').select('*').order('name');
    if (sub) setSubjects(sub);
    setLoading(false);
  };

  // Получить уникальные предметы из расписания для списка "Курсы"
  const activeSubjects = Array.from(new Set(items.map(i => i.subject))).sort();

  // ... (handleEditClick, handleSaveEdit, handleDelete, editDetail, addDetailToEdit, removeDetailFromEdit - ОСТАВЬ ТЕ ЖЕ, что в предыдущем коде) ...
  // Я сократил их здесь для краткости, но ты скопируй их из прошлого версии, они нужны для режима "По дням"
  const handleEditClick = (item: ScheduleItem) => { setEditingItem(JSON.parse(JSON.stringify(item))); };
  const handleSaveEdit = async (e: React.FormEvent) => { /* Код из прошлого ответа */ };
  const handleDelete = async (id: number) => { /* Код из прошлого ответа */ };
  const editDetail = (idx: number, field: string, val: string) => { /* ... */ };
  const addDetailToEdit = () => { /* ... */ };
  const removeDetailFromEdit = (idx: number) => { /* ... */ };

  if (loading) return <div className="p-10 text-gray-500">Загрузка расписания...</div>;

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      
      {/* Toast */}
      {showSuccess && (
          <div className="fixed bottom-5 right-5 bg-green-600 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 transition-all z-50">
            <span className="text-white"><IconCheck /></span><span className="font-bold">Сохранено</span>
          </div>
      )}

      {/* Мастер всегда доступен сверху */}
      <CourseWizard subjects={subjects} bells={bells} onSuccess={() => { fetchData(); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000); }} />

      <div className="mt-12">
        <div className="flex justify-between items-center mb-6 border-b pb-2">
            <h2 className="text-xl font-bold text-gray-800 px-1">Просмотр расписания</h2>
            {/* Переключатель Вида */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button onClick={() => setViewMode('days')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${viewMode === 'days' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>По дням</button>
                <button onClick={() => setViewMode('courses')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${viewMode === 'courses' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>По курсам</button>
            </div>
        </div>
        
        {/* ВИД 1: ПО ДНЯМ (Как было) */}
        {viewMode === 'days' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {DAYS.map(day => {
                    const dayItems = items.filter(i => i.day_of_week === day.id);
                    if (dayItems.length === 0) return null;
                    return (
                        <div key={day.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit flex flex-col">
                            {/* ... Твой код рендера карточек дня из прошлого сообщения ... */}
                            {/* Просто скопируй внутренности map(day => ...) оттуда */}
                             <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-bold text-gray-700 uppercase text-xs tracking-wider flex justify-between">
                                {day.name} <span className="text-gray-400 font-normal">{dayItems.length} пар</span>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {dayItems.map(item => (
                                    <div key={item.id} className="p-4 hover:bg-blue-50 transition group relative">
                                        <div className="text-sm font-bold text-gray-900">{item.subject}</div>
                                        <div className="text-xs text-gray-500 mt-1">{item.pair_number} пара • {formatDateShort(item.start_date)} — {formatDateShort(item.end_date)}</div>
                                        {/* Кнопки */}
                                        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                            <button onClick={() => handleEditClick(item)} className="p-1.5 text-blue-600 bg-white shadow rounded border"><IconEdit /></button>
                                            <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-500 bg-white shadow rounded border"><IconTrash /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        )}

        {/* ВИД 2: ПО КУРСАМ (Новое) */}
        {viewMode === 'courses' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSubjects.map(subName => {
                    // Ищем все записи этого предмета
                    const subItems = items.filter(i => i.subject === subName);
                    // Ищем самую позднюю дату окончания
                    const lastDate = subItems.reduce((max, i) => i.end_date > max ? i.end_date : max, '0000-00-00');

                    return (
                        <div key={subName} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-gray-900">{subName}</h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    Активен до: <span className="font-bold text-gray-700">{formatDateShort(lastDate)}</span>
                                </p>
                                <div className="flex gap-2 mt-2">
                                    {subItems.map(i => (
                                        <span key={i.id} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                            {DAYS[i.day_of_week-1].name.slice(0,2)} {i.pair_number}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <button 
                                onClick={() => setReschedulingSubject(subName)}
                                className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-100 border border-blue-200"
                            >
                                Перестроить
                            </button>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* МОДАЛКА РЕСТРУКТУРИЗАЦИИ */}
      {reschedulingSubject && (
          <CourseRescheduler 
            subjectName={reschedulingSubject} 
            bells={bells}
            onClose={() => setReschedulingSubject(null)}
            onSuccess={() => {
                setReschedulingSubject(null);
                fetchData();
                setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000);
            }}
          />
      )}

      {/* ОБЫЧНАЯ МОДАЛКА РЕДАКТИРОВАНИЯ (Как и была) */}
      {editingItem && (
          /* ... Вставь сюда код модалки из предыдущего файла ... */
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">...</div>
      )}
    </div>
  );
}