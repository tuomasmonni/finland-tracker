'use client';

import { useState } from 'react';
import {
  useUnifiedFilters,
  CRIME_CATEGORIES,
  AVAILABLE_YEARS,
} from '@/lib/contexts/UnifiedFilterContext';

export default function CrimeSettings() {
  const { crime, theme, setCrimeYear, toggleCrimeCategory, setCrimeDisplayMode } = useUnifiedFilters();
  const isDark = theme === 'dark';
  const [infoExpanded, setInfoExpanded] = useState(false);

  return (
    <div className="space-y-3">
      {/* Year */}
      <div>
        <label className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Vuosi
        </label>
        <select
          value={crime.year}
          onChange={(e) => setCrimeYear(e.target.value)}
          className={`w-full mt-1 px-3 py-1.5 rounded-lg border text-xs focus:outline-none transition-colors ${
            isDark
              ? 'bg-zinc-800 text-zinc-200 border-zinc-700 focus:border-blue-500'
              : 'bg-white text-zinc-900 border-zinc-300 focus:border-blue-500'
          }`}
        >
          {AVAILABLE_YEARS.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Display mode */}
      <div>
        <label className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Näyttötapa
        </label>
        <div className={`grid grid-cols-2 gap-1 p-1 rounded-lg mt-1 ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
          <button
            onClick={() => setCrimeDisplayMode('absolute')}
            className={`px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
              crime.displayMode === 'absolute'
                ? 'bg-blue-600 text-white shadow-sm'
                : isDark ? 'text-zinc-400 hover:text-zinc-300' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Absoluuttinen
          </button>
          <button
            onClick={() => setCrimeDisplayMode('perCapita')}
            className={`px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
              crime.displayMode === 'perCapita'
                ? 'bg-blue-600 text-white shadow-sm'
                : isDark ? 'text-zinc-400 hover:text-zinc-300' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Per 100k as.
          </button>
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Kategoriat
        </label>
        <div className="space-y-1 mt-1 max-h-40 overflow-y-auto">
          {CRIME_CATEGORIES.map(cat => (
            <label
              key={cat.code}
              className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'
              }`}
            >
              <input
                type="checkbox"
                checked={crime.categories.includes(cat.code)}
                onChange={() => toggleCrimeCategory(cat.code)}
                className="w-3.5 h-3.5 rounded accent-blue-600"
              />
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className={`text-xs ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                {cat.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Data info */}
      <div className={`border-t pt-2 ${isDark ? 'border-white/5' : 'border-black/5'}`}>
        <button
          onClick={() => setInfoExpanded(!infoExpanded)}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <span>ℹ️</span>
          <span>Tietoa datasta</span>
          <span className={`transition-transform text-[10px] ${infoExpanded ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {infoExpanded && (
          <div className={`mt-2 p-2.5 rounded-lg text-xs leading-relaxed space-y-1.5 ${
            isDark ? 'bg-zinc-800/80 text-zinc-400' : 'bg-zinc-50 text-zinc-600'
          }`}>
            <p><span className="font-semibold">Lähde:</span> Tilastokeskus &ndash; ICCS</p>
            <p><span className="font-semibold">Väkiluku:</span> 31.12. valitulta vuodelta</p>
            <p><span className="font-semibold">Per 100k:</span> rikokset &divide; väkiluku &times; 100&nbsp;000</p>
            <p className={isDark ? 'text-zinc-500' : 'text-zinc-500'}>Data päivitetty: 03.02.2026</p>
          </div>
        )}
      </div>
    </div>
  );
}
