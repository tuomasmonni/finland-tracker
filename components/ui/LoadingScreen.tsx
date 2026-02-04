'use client';

import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';

export default function LoadingScreen() {
  const { theme } = useUnifiedFilters();
  const isDark = theme === 'dark';

  return (
    <div className={`absolute inset-0 z-40 flex items-center justify-center backdrop-blur-sm transition-colors ${
      isDark ? 'bg-zinc-950/80' : 'bg-white/80'
    }`}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className={`absolute inset-0 border-2 rounded-full ${isDark ? 'border-zinc-700' : 'border-zinc-300'}`} />
          <div className="absolute inset-0 border-2 border-transparent border-t-blue-500 rounded-full animate-spin" />
        </div>
        <span className={`text-sm font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Ladataan karttaa...
        </span>
      </div>
    </div>
  );
}
