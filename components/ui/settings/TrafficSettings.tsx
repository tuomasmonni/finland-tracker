'use client';

import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import { EVENT_CATEGORIES, type EventCategory } from '@/lib/constants';

export default function TrafficSettings() {
  const { traffic, theme, setTrafficTimeRange, toggleTrafficCategory } = useUnifiedFilters();
  const isDark = theme === 'dark';

  const timeOptions: { value: typeof traffic.timeRange; label: string }[] = [
    { value: '2h', label: '2h' },
    { value: '8h', label: '8h' },
    { value: '24h', label: '24h' },
    { value: '7d', label: '7pv' },
    { value: 'all', label: 'Kaikki' },
  ];

  const categories: EventCategory[] = ['accident', 'disruption', 'roadwork', 'weather'];

  return (
    <div className="space-y-3">
      {/* Time range */}
      <div>
        <label className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Aikaikkuna
        </label>
        <div className={`grid grid-cols-5 gap-1 p-1 rounded-lg mt-1 ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
          {timeOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setTrafficTimeRange(opt.value)}
              className={`px-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                traffic.timeRange === opt.value
                  ? 'bg-orange-600 text-white shadow-sm'
                  : isDark ? 'text-zinc-400 hover:text-zinc-300' : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Kategoriat
        </label>
        <div className="space-y-1 mt-1">
          {categories.map(cat => (
            <label
              key={cat}
              className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
              }`}
            >
              <input
                type="checkbox"
                checked={traffic.categories.includes(cat)}
                onChange={() => toggleTrafficCategory(cat)}
                className="w-3.5 h-3.5 rounded accent-orange-600"
              />
              <span className="text-sm">{EVENT_CATEGORIES[cat].emoji}</span>
              <span className={`text-xs ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                {EVENT_CATEGORIES[cat].label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
