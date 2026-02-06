'use client';

import { useUnifiedFilters, type WeatherMetric } from '@/lib/contexts/UnifiedFilterContext';

export default function WeatherSettings() {
  const { weather, theme, setWeatherMetric } = useUnifiedFilters();
  const isDark = theme === 'dark';

  const options: { value: WeatherMetric; label: string; icon: string }[] = [
    { value: 'temperature', label: 'Lämpö', icon: '🌡️' },
    { value: 'wind', label: 'Tuuli', icon: '💨' },
    { value: 'precipitation', label: 'Sade', icon: '🌧️' },
  ];

  return (
    <div className="space-y-2">
      <label className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
        Mittari
      </label>
      <div className={`grid grid-cols-3 gap-1 p-1 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => setWeatherMetric(opt.value)}
            className={`px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
              weather.metric === opt.value
                ? 'bg-cyan-600 text-white shadow-sm'
                : isDark ? 'text-zinc-400 hover:text-zinc-300' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            {opt.icon} {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
