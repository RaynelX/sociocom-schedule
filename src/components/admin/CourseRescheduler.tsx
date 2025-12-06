'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { addDays, addWeeks, format, isValid, parseISO, subDays } from 'date-fns';

type Props = {
  subjectName: string;
  bells: any[];
  onClose: () => void;
  onSuccess: () => void;
};

const DAYS = [
  { id: 1, name: 'Понедельник' }, { id: 2, name: 'Вторник' }, { id: 3, name: 'Среда' },
  { id: 4, name: 'Четверг' }, { id: 5, name: 'Пятница' }, { id: 6, name: 'Суббота' },
];

export default function CourseRescheduler({ subjectName, bells, onClose, onSuccess }: Props) {
  // 1. Дата начала изменений (по умолчанию - следующий понедельник или завтра)
  const [changeDate, setChangeDate] = useState(new Date().toISOString().split('T')[0]);
  
  // 2. Сколько осталось провести пар
  const [lessonsRemaining, setLessonsRemaining] = useState(12);
  const [calculatedEndDate, setCalculatedEndDate] = useState('');

  // 3. Новая сетка (по умолчанию одна строка)
  const [slots, setSlots] = useState<Array<{
    id: number;
    day_of_week: number;
    pair_number: number;
    type: string;
    details: Array<{ id: number; subgroup: string; room: string; teacher: string }>;
  }>>([
    { 
      id: 1, day_of_week: 1, pair_number: 1, type: 'seminar', 
      details: [{ id: 1, subgroup: '', room: '', teacher: '' }] 
    }
  ]);

  // Авто-расчет даты окончания
  useEffect(() => {
    if (changeDate && lessonsRemaining > 0 && slots.length > 0) {
        const lessonsPerWeek = slots.length;
        const weeksNeeded = Math.ceil(lessonsRemaining / lessonsPerWeek);
        const start = parseISO(changeDate);
        
        if (isValid(start)) {
            // weekStartsOn: 1 (Monday) logic approximation
            const end = addWeeks(start, Math.max(0, weeksNeeded - 1));
            // Пытаемся попасть в конец недели
            setCalculatedEndDate(format(end, 'yyyy-MM-dd'));
        }
    }
  }, [changeDate, lessonsRemaining, slots.length]);

  // CRUD слотов (упрощенный из Wizard)
  const addSlot = () => {
    const last = slots[slots.length - 1];
    setSlots([...slots, { ...last, id: Date.now(), details: last.details.map(d => ({...d, id: Math.random()})) }]);
  };
  const removeSlot = (id: number) => {
    if (slots.length > 1) setSlots(slots.filter(s => s.id !== id));
  };
  const updateSlotMain = (id: number, field: string, value: any) => {
    setSlots(slots.map(s => s.id === id ? { ...s, [field]: value } : s));
  };
  const updateDetail = (slotId: number, idx: number, field: string, value: string) => {
    setSlots(slots.map(s => {
        if (s.id !== slotId) return s;
        const newDetails = [...s.details];
        newDetails[idx] = { ...newDetails[idx], [field]: value };
        return { ...s, details: newDetails };
    }));
  };

  // === ГЛАВНАЯ ЛОГИКА ===
  const handleSave = async () => {
    if (!confirm(`Внимание!\n\n1. Старое расписание предмета "${subjectName}" будет завершено ${format(subDays(parseISO(changeDate), 1), 'dd.MM.yyyy')}.\n2. С ${format(parseISO(changeDate), 'dd.MM.yyyy')} будет создано новое расписание.\n\nПродолжить?`)) return;

    // 1. "Обрезаем" старые записи (Update end_date)
    // Находим все записи этого предмета, которые заканчиваются ПОЗЖЕ даты изменения
    const cutOffDate = format(subDays(parseISO(changeDate), 1), 'yyyy-MM-dd'); // Вчерашний день от даты изменений

    // Сначала удаляем те, которые начались бы ПОЗЖЕ даты изменения (они вообще не нужны теперь)
    await supabase.from('schedule_items')
        .delete()
        .eq('subject', subjectName)
        .gte('start_date', changeDate);

    // Теперь обновляем те, которые начались РАНЬШЕ, но заканчиваются ПОЗЖЕ
    await supabase.from('schedule_items')
        .update({ end_date: cutOffDate })
        .eq('subject', subjectName)
        .lt('start_date', changeDate)
        .gt('end_date', cutOffDate);

    // 2. Создаем новые записи
    const payload = slots.map(slot => ({
        subject: subjectName,
        day_of_week: slot.day_of_week,
        pair_number: slot.pair_number,
        type: slot.type,
        start_date: changeDate,
        end_date: calculatedEndDate,
        details: slot.details.map(({ subgroup, room, teacher }) => ({ subgroup, room, teacher }))
    }));

    const { error } = await supabase.from('schedule_items').insert(payload);

    if (error) alert('Ошибка: ' + error.message);
    else onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 animate-in zoom-in-95 my-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Изменение курса</h3>
                    <p className="text-blue-600 font-medium">{subjectName}</p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <div className="space-y-6">
                {/* Блок 1: Параметры изменений */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-blue-700 uppercase mb-1">С какой даты меняем?</label>
                        <input type="date" className="w-full border border-blue-200 h-10 px-2 rounded text-sm"
                            value={changeDate} onChange={e => setChangeDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-blue-700 uppercase mb-1">Сколько пар осталось?</label>
                        <div className="flex gap-2">
                            <input type="number" className="w-20 border border-blue-200 h-10 px-2 rounded text-sm text-center font-bold"
                                value={lessonsRemaining} onChange={e => setLessonsRemaining(Number(e.target.value))} />
                            <div className="flex-1 flex flex-col justify-center">
                                <span className="text-[10px] text-blue-500 uppercase">Новая дата окончания</span>
                                <span className="font-bold text-blue-800">{calculatedEndDate ? format(parseISO(calculatedEndDate), 'dd.MM.yyyy') : '...'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Блок 2: Новое расписание */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Новая схема расписания</label>
                    <div className="space-y-3">
                        {slots.map((slot, index) => (
                            <div key={slot.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                <div className="flex flex-wrap gap-2 mb-2">
                                    <select className="border h-8 rounded text-sm" value={slot.day_of_week} onChange={e => updateSlotMain(slot.id, 'day_of_week', Number(e.target.value))}>
                                        {DAYS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                    <select className="border h-8 rounded text-sm" value={slot.pair_number} onChange={e => updateSlotMain(slot.id, 'pair_number', Number(e.target.value))}>
                                        {/* Используем хардкод 1-8 для простоты модалки, или прокинуть bells */}
                                        {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n} пара</option>)}
                                    </select>
                                    <select className="border h-8 rounded text-sm" value={slot.type} onChange={e => updateSlotMain(slot.id, 'type', e.target.value)}>
                                        <option value="seminar">Семинар</option><option value="lecture">Лекция</option><option value="lab">Прак.</option>
                                    </select>
                                    <div className="flex-1"></div>
                                    <button onClick={() => removeSlot(slot.id)} className="text-red-500 text-xs">Удалить</button>
                                </div>
                                {/* Детали (одна строка для простоты, т.к. обычно меняют общее) */}
                                {slot.details.map((d, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input type="text" placeholder="Ауд." className="w-16 border h-8 px-2 rounded text-sm" value={d.room} onChange={e => updateDetail(slot.id, i, 'room', e.target.value)} />
                                        <input type="text" placeholder="Преподаватель" className="flex-1 border h-8 px-2 rounded text-sm" value={d.teacher} onChange={e => updateDetail(slot.id, i, 'teacher', e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        ))}
                        <button onClick={addSlot} className="text-sm text-blue-600 font-bold hover:underline">+ Добавить слот в неделю</button>
                    </div>
                </div>
            </div>

            <div className="flex gap-3 mt-8 pt-4 border-t">
                <button onClick={onClose} className="flex-1 h-11 rounded-lg font-bold text-gray-600 hover:bg-gray-100 transition">Отмена</button>
                <button onClick={handleSave} className="flex-1 h-11 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-700 transition shadow-md">
                    Применить изменения
                </button>
            </div>
        </div>
    </div>
  );
}