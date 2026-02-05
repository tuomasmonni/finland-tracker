'use client';

import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';

const CRIME_QUANTILES = [
  { label: 'Matala (0-25%)', color: '#c6efce' },
  { label: 'Keskitaso (25-50%)', color: '#ffeb9c' },
  { label: 'Korkea (50-75%)', color: '#ffc7ce' },
  { label: 'Erittäin korkea (75-100%)', color: '#ff6b6b' },
];

export default function Legend() {
  const { crime, theme } = useUnifiedFilters();

  const showCrime = crime.layerVisible && crime.categories.length > 0;

  if (!showCrime) return null;

  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-zinc-900/95 border-zinc-700' : 'bg-white/95 border-zinc-200';
  const textMutedClass = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const textClass = isDark ? 'text-zinc-300' : 'text-zinc-700';
  const borderClass = isDark ? 'border-zinc-600' : 'border-zinc-300';

  return (
    <div className={`backdrop-blur-sm rounded-lg border p-4 min-w-[240px] shadow-lg transition-colors ${bgClass}`}>
      {/* Crime legend */}
      <div>
        <h3 className={`text-xs font-semibold ${textMutedClass} mb-2 uppercase tracking-wide`}>
          🔴 Rikostaso ({crime.year})
          {crime.displayMode === 'perCapita' && (
            <span className="text-[10px] ml-1">(per 100k as.)</span>
          )}
        </h3>
        <div className="space-y-1.5">
          {CRIME_QUANTILES.map((q) => (
            <div key={q.label} className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded border ${borderClass}`}
                style={{ backgroundColor: q.color }}
              />
              <span className={`text-xs ${textClass}`}>{q.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
