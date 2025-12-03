'use client';

import { useState } from 'react';
import { format, parseISO, isToday } from "date-fns";
import { ru } from "date-fns/locale";

// Типы событий из базы
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

// Стили карточек
const EVENT_STYLES: Record<string, { label: string; border: string; bg: string; text: string }> = {
  control_work: { label: 'Контрольная работа', border: 'border-red-500', bg: 'bg-red-50', text: 'text-red-700' },
  independent_work: { label: 'УСР', border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
  credit: { label: 'Зачёт', border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-800' },
  exam: { label: 'Экзамен', border: 'border-purple-600', bg: 'bg-purple-50', text: 'text-purple-800' },
  consultation: { label: 'Консультация', border: 'border-indigo-500', bg: 'bg-indigo-50', text: 'text-indigo-800' },
  deadline: { label: 'Дедлайн', border: 'border-orange-400', bg: 'bg-orange-50', text: 'text-orange-900' },
};

// Настройка фильтров
const FILTERS = [
  { id: 'all', label: 'Все' },
  { id: 'exam_group', label: 'Экзамены', types: ['exam', 'consultation'] },
  { id: 'credit_group', label: 'Зачёты', types: ['credit'] },
  { id: 'test_group', label: 'КР и УСР', types: ['control_work', 'independent_work'] },
  { id: 'deadline_group', label: 'Дедлайны', types: ['deadline'] },
];

export default function PlannerList({ initialEvents }: { initialEvents: EventItem[] }) {
  const [activeFilter, setActiveFilter] = useState('all');

  // Фильтрация
  const filteredEvents = initialEvents.filter(event => {
    if (activeFilter === 'all') return true;
    
    const currentFilterConfig = FILTERS.find(f => f.id === activeFilter);
    if (!currentFilterConfig?.types) return true;

    return currentFilterConfig.types.includes(event.type);
  });

  // Группировка по месяцам
  const groupedEvents: Record<string, EventItem[]> = {};
  
  filteredEvents.forEach(event => {
    const date = parseISO(event.date);
    const monthKey = format(date, 'LLLL yyyy', { locale: ru });
    
    if (!groupedEvents[monthKey]) {
        groupedEvents[monthKey] = [];
    }
    groupedEvents[monthKey].push(event);
  });

  return (
    <div className="max-w-md mx-auto p-4">
        
        {/* КНОПКИ ФИЛЬТРОВ */}
        <div className="top-[53px] z-20 bg-gray-100/95 backdrop-blur-sm -mx-4 px-4 py-4 mb-4 border-b border-gray-200/50">
            <div className="flex flex-wrap justify-left gap-2">
                {FILTERS.map(filter => (
                    <button
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition border shadow-sm ${
                            activeFilter === filter.id 
                            ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-100' 
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>
        </div>

        <div className="space-y-8">
            {/* Пустое состояние */}
            {filteredEvents.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                    <p>Ничего не найдено 🤷‍♂️</p>
                    <button onClick={() => setActiveFilter('all')} className="text-blue-500 text-sm mt-2 hover:underline">
                        Показать всё
                    </button>
                </div>
            )}

            {/* Список событий */}
            {Object.entries(groupedEvents).map(([month, monthEvents]) => (
                <div key={month}>
                    <h2 className="text-xl font-bold text-gray-800 mb-4 capitalize pl-1 top-[130px] z-10">
                        {month}
                    </h2>

                    <div className="space-y-3">
                        {monthEvents.map(event => {
                            const style = EVENT_STYLES[event.type] || EVENT_STYLES.deadline;
                            const date = parseISO(event.date);
                            const isTodayEvent = isToday(date);

                            return (
                                <div key={event.id} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${style.border} relative overflow-hidden`}>
                                    <div className="flex gap-4">
                                        {/* Дата */}
                                        <div className="flex flex-col items-center justify-start min-w-[3rem] border-r border-gray-100 pr-4">
                                            <span className={`text-2xl font-bold leading-none ${isTodayEvent ? 'text-blue-600' : 'text-gray-800'}`}>
                                                {format(date, 'd')}
                                            </span>
                                            <span className="text-xs text-gray-400 uppercase font-medium mt-1">
                                                {format(date, 'EEE', { locale: ru })}
                                            </span>
                                        </div>

                                        {/* Контент */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-gray-50 ${style.text} border border-gray-100`}>
                                                    {style.label}
                                                </span>
                                                
                                                {(event.event_time || event.pair_number) && (
                                                    <span className="text-xs font-bold text-gray-500 whitespace-nowrap ml-2">
                                                        {event.event_time ? event.event_time.slice(0,5) : `${event.pair_number} пара`}
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="font-bold text-gray-900 leading-tight break-words">
                                                {event.subject || event.title}
                                            </h3>
                                            
                                            {event.subject && event.title && (
                                                <p className="text-sm text-gray-500 mt-1">{event.title}</p>
                                            )}

                                            {event.room && (
                                                <div className="mt-2 text-xs text-gray-400 flex items-center gap-1 font-medium">
                                                    {event.room}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
}