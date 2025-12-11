import Link from "next/link";
import PlannerList from "@/components/PlannerList";
import { createClient } from "@supabase/supabase-js"; // ОБЫЧНЫЙ КЛИЕНТ
import { unstable_cache } from "next/cache"; // КЭШ

export const dynamic = 'force-dynamic';

// Создаем клиент тут, как в scheduleService
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Функция с кэшированием
const getCachedPlannerData = unstable_cache(
  async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    console.log(`\x1b[31m🔥 [DB HIT] ЗАПРОС ПЛАНЕРА \x1b[0m`);
    
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('date', todayStr)
      .neq('type', 'cancel')
      .order('date', { ascending: true })
      .order('event_time', { ascending: true });

    if (error) console.error(error);
    return data || [];
  },
  ['planner-data'], // Ключ
  { revalidate: false, tags: ['schedule'] }
);

export default async function PlannerPage() {
  const events = await getCachedPlannerData();

  return (
    <main className="min-h-screen bg-gray-100 pb-20 font-sans text-gray-900">
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