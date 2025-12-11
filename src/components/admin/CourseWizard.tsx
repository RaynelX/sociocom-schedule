'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { addWeeks, format, isValid, parseISO } from 'date-fns';
import { revalidateSchedule } from '@/app/actions';

type Props = {
  subjects: any[];
  bells: any[];
  onSuccess: () => void;
};

const DAYS = [
  { id: 1, name: 'Понедельник' }, { id: 2, name: 'Вторник' }, { id: 3, name: 'Среда' },
  { id: 4, name: 'Четверг' }, { id: 5, name: 'Пятница' }, { id: 6, name: 'Суббота' },
]; // Гениально агада

export default function CourseWizard({ subjects, bells, onSuccess }: Props) {
  const supabase = createClient();

  const [selectedSubject, setSelectedSubject] = useState('');
  
  // ЛОГИКА ДАТ
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalLessons, setTotalLessons] = useState(10);
  const [calculatedEndDate, setCalculatedEndDate] = useState('');

  // Слоты времени
  const [slots, setSlots] = useState<Array<{
    id: number;
    day_of_week: number;
    pair_number: number;
    type: string;
    details: Array<{ id: number; subgroup: string; room: string; teacher: string }>;
  }>>([
    { 
      id: 1, day_of_week: 1, pair_number: 1, type: 'lecture', 
      details: [{ id: 1, subgroup: '', room: '', teacher: '' }] 
    }
  ]);

  // АВТО-РАСЧЕТ ДАТЫ ОКОНЧАНИЯ
  useEffect(() => {
    if (startDate && totalLessons > 0 && slots.length > 0) {
        // Сколько пар в неделю мы добавили в мастере?
        const lessonsPerWeek = slots.length;
        // Сколько недель нужно, чтобы вычитать все часы?
        const weeksNeeded = Math.ceil(totalLessons / lessonsPerWeek);
        
        const start = parseISO(startDate);
        if (isValid(start)) {
            // Вычитаем 1, так как первая неделя уже считается
            const end = addWeeks(start, Math.max(0, weeksNeeded - 1));
            setCalculatedEndDate(format(end, 'yyyy-MM-dd'));
        }
    }
  }, [startDate, totalLessons, slots.length]);

  // --- CRUD СЛОТОВ ---
  const addSlot = () => {
    const last = slots[slots.length - 1];
    setSlots([...slots, {
        id: Date.now(),
        day_of_week: last.day_of_week,
        pair_number: last.pair_number < 8 ? last.pair_number + 1 : 1,
        type: last.type,
        details: last.details.map(d => ({ ...d, id: Math.random() })) 
    }]);
  };

  const removeSlot = (id: number) => {
    if (slots.length === 1) return;
    setSlots(slots.filter(s => s.id !== id));
  };

  const updateSlotMain = (id: number, field: string, value: any) => {
    setSlots(slots.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // --- CRUD ДЕТАЛЕЙ (ПОДГРУПП) ---
  const addSubgroupToSlot = (slotId: number) => {
    setSlots(slots.map(s => s.id !== slotId ? s : {
        ...s, details: [...s.details, { id: Math.random(), subgroup: '', room: '', teacher: '' }]
    }));
  };

  const removeSubgroupFromSlot = (slotId: number, detailId: number) => {
    setSlots(slots.map(s => {
        if (s.id !== slotId) return s;
        if (s.details.length === 1) return s; 
        return { ...s, details: s.details.filter(d => d.id !== detailId) };
    }));
  };

  const updateDetail = (slotId: number, detailId: number, field: string, value: string) => {
    setSlots(slots.map(s => {
        if (s.id !== slotId) return s;
        return { ...s, details: s.details.map(d => d.id === detailId ? { ...d, [field]: value } : d) };
    }));
  };

  // --- СОХРАНЕНИЕ ---
  const handleSave = async () => {
    if (!selectedSubject) return alert("Выберите предмет!");
    if (!calculatedEndDate) return alert("Ошибка расчета даты");

    const payload = slots.map(slot => ({
        subject: selectedSubject,
        day_of_week: slot.day_of_week,
        pair_number: slot.pair_number,
        type: slot.type,
        start_date: startDate,
        end_date: calculatedEndDate, // Используем рассчитанную дату
        details: slot.details.map(({ subgroup, room, teacher }) => ({ subgroup, room, teacher }))
    }));

    const { error } = await supabase.from('schedule_items').insert(payload);

    if (error) alert('Ошибка: ' + error.message);
    else {
        // Сброс, оставляем даты для удобства
        setSlots([{ id: Date.now(), day_of_week: 1, pair_number: 1, type: 'lecture', details: [{ id: 1, subgroup: '', room: '', teacher: '' }] }]);
        setSelectedSubject('');
        onSuccess(); 

        await revalidateSchedule();
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Мастер добавления курса</h2>
        
        {/* ВЕРХНЯЯ ПАНЕЛЬ: ПРЕДМЕТ И ДАТЫ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100 items-end">
            <div className="lg:col-span-4">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Предмет</label>
                <select 
                    className="w-full border border-gray-300 h-9 px-2 rounded text-sm outline-none focus:border-blue-500 bg-white"
                    value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}
                >
                    <option value="">-- Выберите --</option>
                    {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
            </div>
            
            <div className="lg:col-span-3">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Дата первого занятия</label>
                <input type="date" className="w-full border border-gray-300 h-9 px-2 rounded text-sm"
                    value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>

            <div className="lg:col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Всего занятий</label>
                <input type="number" min="1" max="100" className="w-full border border-gray-300 h-9 px-2 rounded text-sm text-center"
                    value={totalLessons} onChange={e => setTotalLessons(Number(e.target.value))} />
            </div>

            <div className="lg:col-span-3">
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Дата окончания (Авто)</label>
                <div className="h-9 flex items-center px-3 bg-blue-50 border border-blue-100 rounded text-sm font-bold text-blue-700">
                    {calculatedEndDate ? new Date(calculatedEndDate).toLocaleDateString() : '...'}
                </div>
            </div>
        </div>

        {/* СПИСОК СЛОТОВ */}
        <div className="space-y-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase px-1">Расписание в неделю</label>

            {slots.map((slot) => (
                <div key={slot.id} className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition bg-white shadow-sm">
                    {/* 1. ВРЕМЯ И ТИП */}
                    <div className="flex flex-wrap gap-2 mb-3 items-center">
                        <select className="w-32 border border-gray-300 h-8 rounded text-sm px-1 bg-gray-50 focus:bg-white outline-none"
                            value={slot.day_of_week} onChange={e => updateSlotMain(slot.id, 'day_of_week', Number(e.target.value))}>
                            {DAYS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <select className="w-24 border border-gray-300 h-8 rounded text-sm px-1 bg-gray-50 focus:bg-white outline-none"
                            value={slot.pair_number} onChange={e => updateSlotMain(slot.id, 'pair_number', Number(e.target.value))}>
                            {bells.map(b => <option key={b.pair_number} value={b.pair_number}>{b.pair_number} пара</option>)}
                        </select>
                        <select className="w-28 border border-gray-300 h-8 rounded text-sm px-1 bg-gray-50 focus:bg-white outline-none"
                            value={slot.type} onChange={e => updateSlotMain(slot.id, 'type', e.target.value)}>
                            <option value="lecture">Лекция</option>
                            <option value="seminar">Семинар</option>
                            <option value="lab">Прак.</option>
                            <option value="other">Другое</option>
                        </select>
                        <div className="flex-1"></div>
                        <button onClick={() => removeSlot(slot.id)} className="text-gray-400 hover:text-red-600 text-xs font-medium px-2">Удалить слот</button>
                    </div>

                    {/* 2. ПОДГРУППЫ (КОМПАКТНО) */}
                    <div className="space-y-2 pl-2 border-l-2 border-blue-100">
                        {slot.details.map((detail) => (
                            <div key={detail.id} className="flex gap-2 items-center w-full">
                                {/* ГРУППА: Очень узкое поле */}
                                <input type="text" placeholder="Гр." className="w-14 shrink-0 border border-gray-300 h-8 rounded text-sm px-1 text-center placeholder:text-gray-300"
                                    value={detail.subgroup} onChange={e => updateDetail(slot.id, detail.id, 'subgroup', e.target.value)} />
                                
                                {/* АУДИТОРИЯ: Узкое поле */}
                                <input type="text" placeholder="Ауд." className="w-16 shrink-0 border border-gray-300 h-8 rounded text-sm px-1 text-center placeholder:text-gray-300"
                                    value={detail.room} onChange={e => updateDetail(slot.id, detail.id, 'room', e.target.value)} />
                                
                                {/* ПРЕПОДАВАТЕЛЬ: Занимает всё остальное место */}
                                <input type="text" placeholder="Преподаватель" className="flex-1 border border-gray-300 h-8 rounded text-sm px-2 placeholder:text-gray-300"
                                    value={detail.teacher} onChange={e => updateDetail(slot.id, detail.id, 'teacher', e.target.value)} />
                                
                                {/* Удалить подгруппу */}
                                {slot.details.length > 1 && (
                                    <button onClick={() => removeSubgroupFromSlot(slot.id, detail.id)} className="text-gray-300 hover:text-red-500 px-1 text-lg leading-none">×</button>
                                )}
                            </div>
                        ))}
                        <button onClick={() => addSubgroupToSlot(slot.id)} className="text-[11px] text-blue-600 hover:underline font-bold mt-1 block pl-1">
                            + ДОБАВИТЬ ПОДГРУППУ
                        </button>
                    </div>
                </div>
            ))}

            {/* КНОПКИ ДЕЙСТВИЯ */}
            <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
                <button onClick={addSlot} className="text-xs font-bold text-gray-600 bg-white border border-gray-300 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition">
                    + Добавить слот времени
                </button>
                <div className="flex-1"></div>
                <button onClick={handleSave} className="text-xs font-bold text-white bg-blue-600 px-6 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm">
                    Сохранить
                </button>
            </div>
        </div>
    </div>
  );
}