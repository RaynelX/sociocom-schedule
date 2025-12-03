'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type EventItem = {
  id: number;
  title: string;
  type: string;
  date: string;
  pair_number: number | null;
  subject: string | null;
  event_time: string | null;
  room: string | null;
};

// SVG Иконки
const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
);
const IconCheck = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
);

// === КОНФИГУРАЦИЯ ТИПОВ ===
const EVENT_TYPES = [
  { id: 'cancel', label: 'Отмена пары', icon: '❌', color: 'bg-gray-100 text-gray-700 border-gray-300', 
    needsPair: true, needsTime: false, needsRoom: false, hideDescription: false },
  { id: 'deadline', label: 'Дедлайн', icon: '⏰', color: 'bg-orange-50 text-orange-700 border-orange-200', 
    needsPair: false, needsTime: true, needsRoom: false, hideDescription: false },
  { id: 'control_work', label: 'Контрольная', icon: '🔥', color: 'bg-red-50 text-red-700 border-red-200', 
    needsPair: true, needsTime: false, needsRoom: false, hideDescription: false },
  { id: 'independent_work', label: 'УСР', icon: '📝', color: 'bg-blue-50 text-blue-700 border-blue-200', 
    hasToggle: true, needsRoom: false, hideDescription: false },
  { id: 'credit', label: 'Зачёт', icon: '✅', color: 'bg-green-50 text-green-700 border-green-200', 
    needsPair: true, needsTime: false, needsRoom: true, hideDescription: true },
  { id: 'exam', label: 'Экзамен', icon: '🎓', color: 'bg-purple-50 text-purple-700 border-purple-200', 
    needsPair: false, needsTime: true, needsRoom: true, hideDescription: true },
  { id: 'consultation', label: 'Консультация', icon: '💬', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', 
    needsPair: false, needsTime: true, needsRoom: true, hideDescription: true },
];

export default function EventsTab() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const [isUsrOnPair, setIsUsrOnPair] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    pair_number: 1,
    subject: '',
    event_time: '23:59',
    room: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: eventsData } = await supabase.from('events').select('*').order('date', { ascending: false }).limit(20);
    if (eventsData) setEvents(eventsData);

    const { data: subData } = await supabase.from('subjects').select('*').order('name');
    if (subData) setSubjects(subData);

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;
    
    if (!formData.subject && selectedType !== 'cancel') return alert("Выберите предмет!");

    const config = EVENT_TYPES.find(t => t.id === selectedType);
    if (!config) return;

    let usePair = config.needsPair;
    let useTime = config.needsTime;

    if (config.hasToggle) {
        usePair = isUsrOnPair;
        useTime = !isUsrOnPair;
    }

    const payload = {
        title: config.hideDescription ? '' : formData.title,
        type: selectedType,
        date: formData.date,
        subject: selectedType === 'cancel' ? null : (formData.subject || null), // При отмене предмет null
        pair_number: usePair ? formData.pair_number : null,
        event_time: useTime ? formData.event_time : null,
        room: config.needsRoom ? formData.room : null,
    };

    const { error } = await supabase.from('events').insert([payload]);

    if (error) alert(error.message);
    else {
      setFormData({ ...formData, title: '', subject: '', event_time: '23:59' }); 
      setSelectedType(null);
      fetchData();
      setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить событие?')) return;
    await supabase.from('events').delete().eq('id', id);
    fetchData();
  };

  if (loading) return <div className="p-10">Загрузка...</div>;

  // ГЛАВНОЕ МЕНЮ
  if (!selectedType) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-12">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                    {EVENT_TYPES.map(type => (
                        <button key={type.id} onClick={() => {
                            setSelectedType(type.id);
                            setFormData(prev => ({...prev, subject: ''}));
                            
                            if (type.id === 'deadline') setFormData(prev => ({...prev, event_time: '23:59'}));
                            if (type.id === 'exam' || type.id === 'consultation') setFormData(prev => ({...prev, event_time: '09:00'}));
                            if (type.id === 'independent_work') {
                                setIsUsrOnPair(true);
                                setFormData(prev => ({...prev, event_time: '18:00'}));
                            }
                        }}
                            className={`p-6 rounded-xl border flex flex-col items-center justify-center gap-3 hover:shadow-md transition bg-white border-gray-200 hover:border-blue-300 active:scale-95`}>
                            <span className="text-3xl">{type.icon}</span>
                            <span className="font-bold text-gray-700 text-center">{type.label}</span>
                        </button>
                    ))}
                </div>

                <h2 className="text-lg font-bold text-gray-800 px-1 mb-4">Предстоящие события ({events.length})</h2>
                <div className="space-y-3">
                    {events.map(event => (
                        <div key={event.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center group">
                             <div className="flex gap-4 items-center">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0 
                                    ${EVENT_TYPES.find(t => t.id === event.type)?.color.split(' ')[0] || 'bg-gray-100'}`}>
                                    {EVENT_TYPES.find(t => t.id === event.type)?.icon}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 leading-tight">
                                        {event.subject ? event.subject : (event.type === 'cancel' ? 'Отмена пары' : event.title)}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-0.5 flex flex-wrap gap-2">
                                        {event.title && <span>{event.title} •</span>}
                                        <span>{new Date(event.date).toLocaleDateString()}</span>
                                        {event.pair_number && <span className="bg-gray-100 px-1.5 rounded text-gray-600 text-xs font-medium pt-0.5">{event.pair_number} пара</span>}
                                        {event.event_time && <span className="bg-gray-100 px-1.5 rounded text-gray-600 text-xs font-medium pt-0.5">{event.event_time.slice(0,5)}</span>}
                                        {event.room && <span>• {event.room}</span>}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => handleDelete(event.id)} className="text-gray-300 hover:text-red-600 p-2 transition"><IconTrash /></button>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className={`fixed bottom-5 right-5 bg-gray-900 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 transition-all z-50 ${showSuccess ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}>
                <span className="text-green-400"><IconCheck /></span><span className="font-medium">Сохранено</span>
            </div>
        </div>
      )
  }

  const config = EVENT_TYPES.find(t => t.id === selectedType)!;
  const showPairInput = config.needsPair || (config.hasToggle && isUsrOnPair);
  const showTimeInput = config.needsTime || (config.hasToggle && !isUsrOnPair);

  return (
    <div className="max-w-xl mx-auto animate-in zoom-in-95 duration-200">
        <button onClick={() => setSelectedType(null)} className="text-sm text-gray-500 hover:text-blue-600 mb-4 flex items-center gap-1">
            ← Назад к выбору
        </button>

        <div className={`bg-white p-6 rounded-xl shadow-sm border-2 ${config.color.split(' ').pop()}`}>
             <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">{config.icon}</span>
                <h2 className="text-xl font-bold text-gray-800">Добавить: {config.label}</h2>
             </div>

             <form onSubmit={handleSubmit} className="space-y-4">
                
                {selectedType !== 'cancel' && (
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Предмет</label>
                        <select 
                            required
                            className="w-full border border-gray-300 h-10 px-2 rounded bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                            value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}
                        >
                            <option value="" disabled>Выберите предмет...</option>
                            {subjects.map(sub => (
                                <option key={sub.id} value={sub.name}>{sub.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {!config.hideDescription && (
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                            {selectedType === 'cancel' ? 'Причина отмены' : 'Описание (тема)'}
                        </label>
                        <input type="text" placeholder={selectedType === 'cancel' ? "Преподаватель заболел" : "Необязательно"} 
                            className="w-full border border-gray-300 h-10 px-3 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                            value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                    </div>
                )}

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Дата</label>
                    <input type="date" required className="w-full border border-gray-300 h-10 px-2 rounded text-sm uppercase" 
                        value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>

                {config.hasToggle && (
                    <div className="bg-gray-100 p-1 rounded-lg flex mb-2">
                         <button type="button" onClick={() => setIsUsrOnPair(true)} className={`flex-1 py-1.5 text-xs font-bold rounded transition ${isUsrOnPair ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}>На паре</button>
                         <button type="button" onClick={() => setIsUsrOnPair(false)} className={`flex-1 py-1.5 text-xs font-bold rounded transition ${!isUsrOnPair ? 'bg-white shadow text-blue-700' : 'text-gray-500'}`}>Дистанционно</button>
                    </div>
                )}

                {showPairInput && (
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Номер пары</label>
                        <select className="w-full border border-gray-300 h-10 px-2 rounded bg-white text-sm" 
                            value={formData.pair_number} onChange={e => setFormData({...formData, pair_number: Number(e.target.value)})}>
                            {[1,2,3,4,5].map(num => <option key={num} value={num}>{num} пара</option>)}
                        </select>
                    </div>
                )}

                {showTimeInput && (
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Время события</label>
                        <input type="time" required className="w-full border border-gray-300 h-10 px-2 rounded text-sm" 
                            value={formData.event_time} onChange={e => setFormData({...formData, event_time: e.target.value})} />
                    </div>
                )}

                {config.needsRoom && (
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Аудитория</label>
                        <input type="text" placeholder="305-а" className="w-full border border-gray-300 h-10 px-3 rounded text-sm outline-none" 
                            value={formData.room} onChange={e => setFormData({...formData, room: e.target.value})} />
                    </div>
                )}

                <div className="pt-2">
                    <button type="submit" className={`w-full h-11 rounded-lg font-bold text-white shadow-sm transition transform active:scale-[0.99] bg-blue-600 hover:bg-blue-700`}>
                        Добавить
                    </button>
                </div>
             </form>
        </div>
    </div>
  );
}