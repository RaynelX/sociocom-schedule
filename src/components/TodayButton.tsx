'use client';

export default function TodayButton() {
  const scrollToToday = () => {
    const element = document.getElementById('today');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <button 
      onClick={scrollToToday} 
      className="text-[10px] bg-blue-500 px-2 py-1 rounded hover:bg-blue-400 transition uppercase font-bold tracking-wider"
    >
      Сегодня
    </button>
  );
}