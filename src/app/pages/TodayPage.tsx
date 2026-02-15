import { useSetPageHeader } from '../providers/PageHeaderProvider';
import { useTodaySchedule } from '../../features/today/hooks/use-today-schedule';
import { useUpcomingEvents } from '../../features/today/hooks/use-upcoming-events';
import { useSemesterProgress } from '../../features/today/hooks/use-semester-progress';
import { TodayPairsBlock } from '../../features/today/components/TodayPairsBlock';
import { UpcomingEventsBlock } from '../../features/today/components/UpcomingEventsBlock';
import { SemesterBlock } from '../../features/today/components/SemesterBlock';

export function TodayPage() {
  const todaySchedule = useTodaySchedule();
  const upcomingEvents = useUpcomingEvents();
  const semesterProgress = useSemesterProgress();

  const subtitle = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date());

  useSetPageHeader({
    title: 'Сегодня',
    subtitle: subtitle.charAt(0).toUpperCase() + subtitle.slice(1),
  });

  if (todaySchedule.loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-neutral-400">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      <TodayPairsBlock data={todaySchedule} />
      <UpcomingEventsBlock events={upcomingEvents.events} />
      <SemesterBlock data={semesterProgress} />
    </div>
  );
}