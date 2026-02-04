'use client';

import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';

export default function Header() {
  const { theme, setTheme } = useUnifiedFilters();

  const isDark = theme === 'dark';

  return (
    <header className={`absolute top-0 left-0 right-0 z-20 p-2 sm:p-4 ${isDark ? 'bg-zinc-950/50' : 'bg-white/50'} backdrop-blur`}>
      <div className="flex items-center justify-between gap-2">
        {/* Logo + Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-lg sm:text-xl">📍</span>
          </div>
          <div className="min-w-0">
            <h1 className={`text-lg sm:text-xl font-bold truncate ${isDark ? 'text-white' : 'text-zinc-900'}`}>Tilannekuva</h1>
            <p className={`text-xs hidden sm:block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Suomen reaaliaikainen kartta</p>
          </div>
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={`p-2 rounded-lg backdrop-blur transition-colors ${
            isDark
              ? 'bg-zinc-800/80 hover:bg-zinc-700/80'
              : 'bg-zinc-200/80 hover:bg-zinc-300/80'
          }`}
          title={theme === 'dark' ? 'Siirry vaalean tilan' : 'Siirry tumman tilan'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}
