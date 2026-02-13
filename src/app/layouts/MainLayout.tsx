import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, BookOpen, Menu } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Сегодня' },
  { to: '/schedule', icon: Calendar, label: 'Расписание' },
  { to: '/subjects', icon: BookOpen, label: 'Предметы' },
  { to: '/more', icon: Menu, label: 'Ещё' },
];

export function MainLayout() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-900">Student Hub</h1>
        <SyncIndicator />
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="shrink-0 flex border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-400 active:text-gray-600'
              }`
            }
          >
            <Icon size={20} strokeWidth={1.5} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function SyncIndicator() {
  // Заглушка — реальная логика появится в фазе 1
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-400">
      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
      <span>Актуально</span>
    </div>
  );
}