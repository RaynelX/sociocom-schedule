"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Layers, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Сегодня",
    href: "/",
    icon: Home,
  },
  {
    label: "Расписание",
    href: "/schedule",
    icon: CalendarDays,
  },
  {
    label: "Планер",
    href: "/planner",
    icon: CalendarDays,
  },
  {
    label: "Курсы",
    href: "/courses",
    icon: Layers,
  },
  {
    label: "Ещё",
    href: "/settings",
    icon: Settings,
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center h-full active:scale-90 transition-transform duration-100"
            >
              <Icon
                size={24}
                className={cn(
                  "mb-1 transition-colors",
                  isActive ? "text-blue-600" : "text-gray-400"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-blue-600" : "text-gray-400"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}