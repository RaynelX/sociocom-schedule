import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import PlannerList from "@/components/PlannerList";

export const revalidate = 0; 

async function getPlannerData() {
  const todayStr = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('date', todayStr)
    .neq('type', 'cancel')
    .order('date', { ascending: true })
    .order('event_time', { ascending: true });

  if (error) console.error(error);
  return data || [];
}

export default async function PlannerPage() {
  const events = await getPlannerData();

  return (
    <main className="min-h-screen bg-gray-100 pb-20 font-sans text-gray-900">
      
      {/* Шапка */}
      <header className="bg-white px-4 py-3 sticky top-0 z-30 shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto flex items-center justify-between">
            <Link href="/" className="text-blue-600 font-medium flex items-center gap-1 text-sm hover:underline">
                ← Расписание
            </Link>
            <h1 className="text-base font-bold text-gray-800">Планер</h1>
            <div className="w-16"></div>
        </div>
      </header>

      <PlannerList initialEvents={events} />
      
    </main>
  );
}