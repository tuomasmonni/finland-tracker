'use client';

import {
  useUnifiedFilters,
  CRIME_CATEGORIES,
} from '@/lib/contexts/UnifiedFilterContext';
import { EVENT_CATEGORIES } from '@/lib/constants';

const CRIME_QUANTILES = [
  { label: 'Matala (0-25%)', color: '#c6efce' },
  { label: 'Keskitaso (25-50%)', color: '#ffeb9c' },
  { label: 'Korkea (50-75%)', color: '#ffc7ce' },
  { label: 'Erittäin korkea (75-100%)', color: '#ff6b6b' },
];

export default function Legend() {
  const { crime, traffic, theme } = useUnifiedFilters();

  const showCrime = crime.layerVisible && crime.categories.length > 0;
  const showTraffic = traffic.layerVisible && traffic.categories.length > 0;

  if (!showCrime && !showTraffic) return null;

  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-zinc-900/95 border-zinc-700' : 'bg-white/95 border-zinc-200';
  const textMutedClass = isDark ? 'text-zinc-400' : 'text-zinc-600';
  const textClass = isDark ? 'text-zinc-300' : 'text-zinc-700';
  const borderClass = isDark ? 'border-zinc-600' : 'border-zinc-300';

  return (
    <div className={`absolute bottom-8 right-4 z-10 backdrop-blur-sm rounded-lg border p-4 min-w-[240px] shadow-lg transition-colors ${bgClass}`}>
      {/* Crime legend */}
      {showCrime && (
        <div className="mb-4">
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
      )}

      {/* Traffic legend */}
      {showTraffic && (
        <div>
          <h3 className={`text-xs font-semibold ${textMutedClass} mb-2 uppercase tracking-wide`}>
            🚗 Tapahtumat
          </h3>
          <div className="space-y-1.5">
            {traffic.categories.map((cat) => {
              const data = EVENT_CATEGORIES[cat];
              return (
                <div key={cat} className="flex items-center gap-2">
                  <span className="text-lg">{data.emoji}</span>
                  <span className={`text-xs ${textClass}`}>{data.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
