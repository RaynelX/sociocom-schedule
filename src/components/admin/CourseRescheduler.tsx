// --- START OF FILE CourseRescheduler.tsx ---

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { addWeeks, format, isValid, parseISO, subDays } from 'date-fns';
import { revalidateSchedule } from '@/app/actions';

// --- TYPES ---
interface Bell {
  pair_number: number;
  start_time: string;
  end_time: string;
}

interface SlotDetail {
  id: string;
  subgroup: string;
  room: string;
  teacher: string;
}

interface Slot {
  id: string;
  day_of_week: number;
  pair_number: number;
  type: string;
  details: SlotDetail[];
}

interface DbScheduleItem {
  id: number;
  subject: string;
  day_of_week: number;
  pair_number: number;
  type: string;
  start_date: string;
  end_date: string;
  details: any[]; // JSONB in DB comes as any/array
}

type Props = {
  subjectName: string;
  bells: Bell[];
  onClose: () => void;
  onSuccess: () => void;
};

const DAYS = [
  { id: 1, name: 'Понедельник' }, { id: 2, name: 'Вторник' }, { id: 3, name: 'Среда' },
  { id: 4, name: 'Четверг' }, { id: 5, name: 'Пятница' }, { id: 6, name: 'Суббота' },
];

// Utility for stable IDs
const generateId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random()}`;

export default function CourseRescheduler({ subjectName, bells, onClose, onSuccess }: Props) {
  const supabase = createClient();
  
  // 1. Дата начала изменений (по умолчанию - СЕГОДНЯ)
  const [changeDate, setChangeDate] = useState(new Date().toISOString().split('T')[0]);
  
  // 2. Параметры курса
  const [lessonsRemaining, setLessonsRemaining] = useState(12);
  const [calculatedEndDate, setCalculatedEndDate] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);

  // 3. Сетка (Slots)
  const [slots, setSlots] = useState<Slot[]>([]);

  // === ЗАГРУЗКА ТЕКУЩИХ ДАННЫХ ===
  useEffect(() => {
    let isMounted = true;

    const loadCurrentSchedule = async () => {
        setIsLoadingData(true);
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
            .from('schedule_items')
            .select('*')
            .eq('subject', subjectName)
            .gte('end_date', today); // Берем только актуальное

        if (!isMounted) return;

        if (error) {
            console.error("Error loading schedule:", error);
            setIsLoadingData(false);
            return;
        }

        if (data && data.length > 0) {
            // Маппинг данных из БД в UI-структуру
            const mappedSlots: Slot[] = data.map((item: DbScheduleItem) => ({
                id: generateId(), // Генерируем новый ID для UI
                day_of_week: item.day_of_week,
                pair_number: item.pair_number,
                type: item.type,
                details: Array.isArray(item.details) 
                    ? item.details.map((d: any) => ({
                        id: generateId(),
                        subgroup: d.subgroup || '',
                        room: d.room || '',
                        teacher: d.teacher || ''
                    }))
                    : [{ id: generateId(), subgroup: '', room: '', teacher: '' }]
            }));
            
            // Удаляем дубликаты по времени (если в БД есть несколько записей на одно время, но разные даты - в мастере это один слот)
            // Упрощенная логика: берем уникальные комбинации дня и пары
            const uniqueSlots = mappedSlots.filter((slot, index, self) =>
                index === self.findIndex((s) => (
                    s.day_of_week === slot.day_of_week && s.pair_number === slot.pair_number
                ))
            );

            setSlots(uniqueSlots);
            // Пытаемся угадать дату начала изменений - берем start_date первого актуального элемента
            if (data[0]?.start_date) {
                 // Если дата в прошлом, оставляем "сегодня", если в будущем - ставим её
                 setChangeDate(data[0].start_date < today ? today : data[0].start_date);
            }
        } else {
            // Если данных нет, создаем пустой слот
            setSlots([{ 
                id: generateId(), 
                day_of_week: 1, 
                pair_number: 1, 
                type: 'seminar', 
                details: [{ id: generateId(), subgroup: '', room: '', teacher: '' }] 
            }]);
        }
        setIsLoadingData(false);
    };

    loadCurrentSchedule();
    
    return () => { isMounted = false; };
  }, [subjectName]);

  // Авто-расчет даты окончания
  useEffect(() => {
    if (!changeDate || lessonsRemaining <= 0 || slots.length === 0) return;
    
    const lessonsPerWeek = slots.length;
    const weeksNeeded = Math.ceil(lessonsRemaining / lessonsPerWeek);
    const start = parseISO(changeDate);
    
    if (isValid(start)) {
        const end = addWeeks(start, Math.max(0, weeksNeeded - 1));
        setCalculatedEndDate(format(end, 'yyyy-MM-dd'));
    }
  }, [changeDate, lessonsRemaining, slots.length]);

  // --- CRUD СЛОТОВ (useCallback) ---

  const addSlot = useCallback(() => {
    setSlots(prev => {
        const last = prev.length > 0 ? prev[prev.length - 1] : null;
        const newSlot: Slot = {
            id: generateId(),
            day_of_week: last ? last.day_of_week : 1,
            pair_number: last ? (last.pair_number < 8 ? last.pair_number + 1 : 1) : 1,
            type: last ? last.type : 'seminar',
            details: last ? last.details.map(d => ({ ...d, id: generateId() })) : [{ id: generateId(), subgroup: '', room: '', teacher: '' }]
        };
        return [...prev, newSlot];
    });
  }, []);

  const removeSlot = useCallback((id: string) => {
    setSlots(prev => prev.length > 1 ? prev.filter(s => s.id !== id) : prev);
  }, []);

  const updateSlotMain = useCallback((id: string, field: keyof Slot, value: any) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }, []);

  // --- CRUD ДЕТАЛЕЙ ---

  const addSubgroupToSlot = useCallback((slotId: string) => {
    setSlots(prev => prev.map(s => s.id !== slotId ? s : {
        ...s, details: [...s.details, { id: generateId(), subgroup: '', room: '', teacher: '' }]
    }));
  }, []);

  const removeSubgroupFromSlot = useCallback((slotId: string, detailId: string) => {
    setSlots(prev => prev.map(s => {
        if (s.id !== slotId) return s;
        if (s.details.length === 1) return s; 
        return { ...s, details: s.details.filter(d => d.id !== detailId) };
    }));
  }, []);

  const updateDetail = useCallback((slotId: string, detailId: string, field: keyof SlotDetail, value: string) => {
    setSlots(prev => prev.map(s => {
        if (s.id !== slotId) return s;
        return { ...s, details: s.details.map(d => d.id === detailId ? { ...d, [field]: value } : d) };
    }));
  }, []);

  // === СОХРАНЕНИЕ ===
  const handleSave = async () => {
    if (!changeDate) return alert("Выберите дату начала изменений");
    if (!isValid(parseISO(changeDate))) return alert("Некорректная дата");

    // Формируем дату отсечения (день перед датой изменений)
    const cutOffDateObj = subDays(parseISO(changeDate), 1);
    const cutOffDate = format(cutOffDateObj, 'yyyy-MM-dd');
    
    const confirmMessage = `Подтвердите изменение:\n\n1. Текущее расписание по предмету "${subjectName}" будет завершено: ${format(cutOffDateObj, 'dd.MM.yyyy')}.\n2. С ${format(parseISO(changeDate), 'dd.MM.yyyy')} вступит в силу новая схема (${slots.length} пар/нед).\n\nПродолжить?`;
    
    if (!window.confirm(confirmMessage)) return;

    try {
        // 1. Удаляем все будущие записи, которые полностью попадают в новый диапазон
        const { error: deleteError } = await supabase
            .from('schedule_items')
            .delete()
            .eq('subject', subjectName)
            .gte('start_date', changeDate);
        
        if (deleteError) throw deleteError;

        // 2. Обрезаем текущие записи (которые начались раньше, но заканчиваются позже даты изменения)
        const { error: updateError } = await supabase
            .from('schedule_items')
            .update({ end_date: cutOffDate })
            .eq('subject', subjectName)
            .lt('start_date', changeDate)
            .gt('end_date', cutOffDate);

        if (updateError) throw updateError;

        // 3. Вставляем новые записи
        if (slots.length > 0) {
            const payload = slots.map(slot => ({
                subject: subjectName,
                day_of_week: slot.day_of_week,
                pair_number: slot.pair_number,
                type: slot.type,
                start_date: changeDate,
                end_date: calculatedEndDate,
                details: slot.details.map(({ subgroup, room, teacher }) => ({ subgroup, room, teacher }))
            }));

            const { error: insertError } = await supabase.from('schedule_items').insert(payload);
            if (insertError) throw insertError;
        }

        await revalidateSchedule();
        onSuccess();
    } catch (error: any) {
        console.error(error);
        alert('Ошибка при обновлении: ' + (error.message || 'Неизвестная ошибка'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 animate-modal my-auto">
            
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Перестройка курса</h3>
                    <p className="text-blue-600 font-medium text-sm mt-1">{subjectName}</p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            {isLoadingData ? (
                <div className="py-20 text-center text-gray-500">Загрузка текущей структуры курса...</div>
            ) : (
                <div className="space-y-6">
                    {/* Блок 1: Даты */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-blue-700 uppercase mb-1">С какой даты меняем?</label>
                            <input 
                                type="date" 
                                className="w-full border border-blue-200 h-9 px-2 rounded text-sm bg-white"
                                value={changeDate} 
                                onChange={e => setChangeDate(e.target.value)} 
                            />
                            <p className="text-[10px] text-blue-400 mt-1">Обычно это "Сегодня" или "Следующий понедельник"</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-24">
                                <label className="block text-[10px] font-bold text-blue-700 uppercase mb-1">Осталось пар</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    className="w-full border border-blue-200 h-9 px-2 rounded text-sm text-center font-bold bg-white"
                                    value={lessonsRemaining} 
                                    onChange={e => setLessonsRemaining(Number(e.target.value))} 
                                />
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                                <span className="text-[10px] text-blue-500 uppercase">Новая дата окончания</span>
                                <span className="font-bold text-blue-800 text-sm">
                                    {calculatedEndDate ? format(parseISO(calculatedEndDate), 'dd.MM.yyyy') : '...'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Блок 2: Сетка */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-gray-500 uppercase px-1">Новое расписание в неделю</label>
                        
                        {slots.map((slot) => (
                            <div key={slot.id} className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 transition bg-white shadow-sm">
                                <div className="flex flex-wrap gap-2 mb-3 items-center">
                                    <select 
                                        className="w-32 border border-gray-300 h-8 rounded text-sm px-1 bg-gray-50 focus:bg-white outline-none"
                                        value={slot.day_of_week} 
                                        onChange={e => updateSlotMain(slot.id, 'day_of_week', Number(e.target.value))}
                                    >
                                        {DAYS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                    <select 
                                        className="w-24 border border-gray-300 h-8 rounded text-sm px-1 bg-gray-50 focus:bg-white outline-none"
                                        value={slot.pair_number} 
                                        onChange={e => updateSlotMain(slot.id, 'pair_number', Number(e.target.value))}
                                    >
                                        {bells.map(b => <option key={b.pair_number} value={b.pair_number}>{b.pair_number} пара</option>)}
                                    </select>
                                    <select 
                                        className="w-28 border border-gray-300 h-8 rounded text-sm px-1 bg-gray-50 focus:bg-white outline-none"
                                        value={slot.type} 
                                        onChange={e => updateSlotMain(slot.id, 'type', e.target.value)}
                                    >
                                        <option value="seminar">Семинар</option>
                                        <option value="lecture">Лекция</option>
                                        <option value="lab">Прак.</option>
                                        <option value="other">Другое</option>
                                    </select>
                                    <div className="flex-1"></div>
                                    
                                    {slots.length > 1 && (
                                        <button 
                                            onClick={() => removeSlot(slot.id)} 
                                            className="text-gray-400 hover:text-red-600 text-xs font-medium px-2"
                                        >
                                            Удалить
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-2 pl-2 border-l-2 border-blue-100">
                                    {slot.details.map((detail) => (
                                        <div key={detail.id} className="flex gap-2 items-center w-full">
                                            <input 
                                                type="text" placeholder="Гр." 
                                                className="w-14 shrink-0 border border-gray-300 h-8 rounded text-sm px-1 text-center placeholder:text-gray-400"
                                                value={detail.subgroup} 
                                                onChange={e => updateDetail(slot.id, detail.id, 'subgroup', e.target.value)} 
                                            />
                                            <input 
                                                type="text" placeholder="Ауд." 
                                                className="w-16 shrink-0 border border-gray-300 h-8 rounded text-sm px-1 text-center placeholder:text-gray-400"
                                                value={detail.room} 
                                                onChange={e => updateDetail(slot.id, detail.id, 'room', e.target.value)} 
                                            />
                                            <input 
                                                type="text" placeholder="Преподаватель" 
                                                className="flex-1 border border-gray-300 h-8 rounded text-sm px-2 placeholder:text-gray-400"
                                                value={detail.teacher} 
                                                onChange={e => updateDetail(slot.id, detail.id, 'teacher', e.target.value)} 
                                            />
                                            {slot.details.length > 1 && (
                                                <button 
                                                    onClick={() => removeSubgroupFromSlot(slot.id, detail.id)} 
                                                    className="text-gray-300 hover:text-red-500 px-1 text-lg leading-none"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => addSubgroupToSlot(slot.id)} 
                                        className="text-[11px] text-blue-600 hover:underline font-bold mt-1 block pl-1"
                                    >
                                        + Добавить подгруппу
                                    </button>
                                </div>
                            </div>
                        ))}

                        <button 
                            onClick={addSlot} 
                            className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-100 transition block w-full border-dashed"
                        >
                            + Добавить слот
                        </button>
                    </div>
                </div>
            )}

            <div className="flex gap-3 mt-8 pt-4 border-t">
                <button 
                    onClick={onClose} 
                    className="flex-1 h-10 rounded-lg font-bold text-gray-600 hover:bg-gray-100 transition text-sm"
                >
                    Отмена
                </button>
                <button 
                    onClick={handleSave} 
                    className="flex-1 h-10 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-md text-sm"
                >
                    Применить изменения
                </button>
            </div>
        </div>
    </div>
  );
}