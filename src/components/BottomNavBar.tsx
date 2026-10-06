import React from 'react';
import {
  LayoutDashboard,
  FolderLock,
  FolderOpen,
  Sparkles,
  Settings,
  History,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'vault' | 'folders' | 'logs' | 'settings';

interface BottomNavBarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  recordingsCount: number;
  isDarkMode: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onSelectTab,
  recordingsCount,
  isDarkMode,
}) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: 'Home', icon: LayoutDashboard },
    {
      id: 'vault' as NavTab,
      label: 'Vault',
      icon: FolderLock,
      badge: recordingsCount > 0 ? recordingsCount : undefined,
    },
    { id: 'folders' as NavTab, label: 'SAF Folders', icon: FolderOpen },
    { id: 'logs' as NavTab, label: 'Audit Logs', icon: History },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className={`w-full px-2 py-1.5 flex items-center justify-around border-t select-none z-20 shrink-0 ${
      isDarkMode
        ? 'bg-[#0d141e]/95 border-slate-800/80 backdrop-blur-lg'
        : 'bg-white/95 border-slate-200/80 backdrop-blur-lg'
    }`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all relative ${
              isActive
                ? 'text-emerald-400 font-bold'
                : isDarkMode
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {/* Active Pill Indicator (Material 3 style) */}
            <div
              className={`px-4 py-1 rounded-full transition-all duration-200 relative ${
                isActive
                  ? isDarkMode
                    ? 'bg-emerald-500/20 text-emerald-400 shadow-sm shadow-emerald-500/20'
                    : 'bg-emerald-100 text-emerald-700'
                  : 'bg-transparent'
              }`}
            >
              <Icon className="w-5 h-5" />

              {tab.badge !== undefined && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[16px] text-[9px] font-bold bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center shadow-md">
                  {tab.badge}
                </span>
              )}
            </div>

            <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
