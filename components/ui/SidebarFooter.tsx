'use client';

import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';

interface SidebarFooterProps {
  collapsed: boolean;
}

export default function SidebarFooter({ collapsed }: SidebarFooterProps) {
  const { theme, setTheme } = useUnifiedFilters();
  const isDark = theme === 'dark';

  if (collapsed) {
    return (
      <div className={`p-2 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={`w-full p-2 rounded-lg transition-colors ${
            isDark ? 'hover:bg-white/10 text-zinc-400' : 'hover:bg-black/10 text-zinc-600'
          }`}
          aria-label={isDark ? 'Vaihda vaaleaan teemaan' : 'Vaihda tummaan teemaan'}
        >
          {isDark ? '🌙' : '☀️'}
        </button>
      </div>
    );
  }

  return (
    <div className={`p-3 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
            isDark
              ? 'hover:bg-white/10 text-zinc-400 hover:text-zinc-200'
              : 'hover:bg-black/10 text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <span>{isDark ? '🌙' : '☀️'}</span>
          <span>{isDark ? 'Tumma' : 'Vaalea'}</span>
        </button>
        <span className={`text-[10px] ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
          tilannetieto.fi
        </span>
      </div>
    </div>
  );
}
