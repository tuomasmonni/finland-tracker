'use client';

import { useUnifiedFilters, type TransitVehicleType } from '@/lib/contexts/UnifiedFilterContext';

export default function TransitSettings() {
  const { transit, theme, toggleTransitVehicleType } = useUnifiedFilters();
  const isDark = theme === 'dark';

  const vehicleTypes: { type: TransitVehicleType; label: string; emoji: string }[] = [
    { type: 'bus', label: 'Bussi', emoji: '🚌' },
    { type: 'tram', label: 'Ratikka', emoji: '🚊' },
    { type: 'metro', label: 'Metro', emoji: '🚇' },
    { type: 'train', label: 'Lähijuna', emoji: '🚆' },
  ];

  return (
    <div>
      <label className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
        Ajoneuvotyyppi
      </label>
      <div className="space-y-1 mt-1">
        {vehicleTypes.map(vt => (
          <label
            key={vt.type}
            className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
              isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
            }`}
          >
            <input
              type="checkbox"
              checked={transit.vehicleTypes.includes(vt.type)}
              onChange={() => toggleTransitVehicleType(vt.type)}
              className="w-3.5 h-3.5 rounded accent-emerald-600"
            />
            <span className="text-sm">{vt.emoji}</span>
            <span className={`text-xs ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
              {vt.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
