'use client';

import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';

interface LayerSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function LayerSearch({ value, onChange }: LayerSearchProps) {
  const { theme } = useUnifiedFilters();
  const isDark = theme === 'dark';

  return (
    <div className="px-3 py-2">
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
        isDark ? 'bg-white/5 focus-within:bg-white/10' : 'bg-black/5 focus-within:bg-black/10'
      }`}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className={isDark ? 'text-zinc-500' : 'text-zinc-400'}
        >
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          placeholder="Hae..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`bg-transparent text-xs outline-none w-full ${
            isDark ? 'text-zinc-200 placeholder:text-zinc-500' : 'text-zinc-800 placeholder:text-zinc-400'
          }`}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className={`text-xs ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'}`}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
