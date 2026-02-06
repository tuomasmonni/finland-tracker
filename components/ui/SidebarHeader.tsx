'use client';

import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';

interface SidebarHeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function SidebarHeader({ collapsed, onToggleCollapse }: SidebarHeaderProps) {
  const { theme } = useUnifiedFilters();
  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center px-3 py-3 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
      {!collapsed && (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center flex-shrink-0">
            <span className="text-sm">📍</span>
          </div>
          <span className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            Tilannetieto
          </span>
        </div>
      )}
      <button
        onClick={onToggleCollapse}
        className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
          isDark ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-black/10 text-zinc-600'
        } ${collapsed ? 'mx-auto' : ''}`}
        aria-label={collapsed ? 'Laajenna sivupalkki' : 'Pienennä sivupalkki'}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`transition-transform ${collapsed ? 'rotate-180' : ''}`}
        >
          <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}
