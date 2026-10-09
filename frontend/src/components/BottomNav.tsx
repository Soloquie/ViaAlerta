import React from 'react';
import { Home, Newspaper, PlusCircle, UserPlus, Bell } from 'lucide-react';

export type TabId = 'inicio' | 'noticias' | 'contribuir' | 'social' | 'notificaciones';

interface BottomNavProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  unreadCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  unreadCount = 0,
}) => {
  const tabs = [
    { id: 'inicio' as TabId, label: 'Inicio', icon: Home },
    { id: 'noticias' as TabId, label: 'Noticias', icon: Newspaper },
    { id: 'contribuir' as TabId, label: 'Contribuir', icon: PlusCircle, isCenter: true },
    { id: 'social' as TabId, label: 'Social', icon: UserPlus },
    { id: 'notificaciones' as TabId, label: 'Notificaciones', icon: Bell, badge: unreadCount },
  ];

  return (
    <nav 
      aria-label="Navegación principal"
      className="bg-[#222428] text-white shrink-0 relative z-30 border-t border-[#31343a] pb-[max(env(safe-area-inset-bottom),8px)] pt-1"
    >
      <div className="grid grid-cols-5 items-center max-w-[430px] mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isCenter) {
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                aria-label="Reportar un problema vial (Contribuir)"
                aria-current={isActive ? 'page' : undefined}
                className="flex flex-col items-center justify-center min-h-[48px] py-1 text-center transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A9DC4] rounded-lg"
              >
                <div className={`p-1 rounded-full transition-transform group-active:scale-95 ${isActive ? 'text-[#0A9DC4]' : 'text-slate-200 hover:text-white'}`}>
                  <Icon className="w-6 h-6 stroke-[2]" />
                </div>
                <span className={`text-[10px] tracking-tight font-medium ${isActive ? 'text-[#0A9DC4] font-semibold' : 'text-slate-300'}`}>
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex flex-col items-center justify-center min-h-[48px] py-1 text-center transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A9DC4] rounded-lg"
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-colors stroke-[2] ${
                    isActive ? 'text-[#0A9DC4]' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 bg-[#D93B3B] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-[#222428]">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                ) : null}
              </div>
              <span
                className={`text-[10px] tracking-tight mt-1 transition-colors ${
                  isActive ? 'text-[#0A9DC4] font-semibold' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
