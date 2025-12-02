'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import ScheduleTab from '@/components/admin/ScheduleTab';
import EventsTab from '@/components/admin/EventsTab';
import SubjectsTab from '@/components/admin/SubjectsTab';

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'schedule' | 'events' | 'subjects'>('schedule');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push('/login');
    };
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
      
      <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">🛠 Админка</h1>
          <div className="flex gap-4">
            <Link href="/" className="text-blue-600 hover:underline text-sm flex items-center">На сайт ↗</Link>
            <button onClick={handleLogout} className="text-red-600 text-sm hover:text-red-800">Выйти</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-6">
        
        {/* Переключатель вкладок */}
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-xl mb-8 w-fit overflow-x-auto max-w-full">
          <button onClick={() => setActiveTab('schedule')} className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition ${activeTab === 'schedule' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            📅 Расписание
          </button>
          <button onClick={() => setActiveTab('events')} className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition ${activeTab === 'events' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            🔥 События
          </button>
          <button onClick={() => setActiveTab('subjects')} className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition ${activeTab === 'subjects' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            📚 Курсы
          </button>
        </div>

        {activeTab === 'schedule' ? <ScheduleTab /> : activeTab === 'events' ? <EventsTab /> : <SubjectsTab />}

      </main>
    </div>
  );
}