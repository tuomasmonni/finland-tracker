'use client';

import { useState, useEffect } from 'react';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import type { WeatherCameraStation } from '@/lib/data/weathercam/types';

export default function WeatherCameraModal() {
  const { weatherCamera, setSelectedWeatherCamera, theme } = useUnifiedFilters();
  const [station, setStation] = useState<WeatherCameraStation | null>(null);
  const [fullscreenPreset, setFullscreenPreset] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Hae aseman tiedot kun selectedStationId muuttuu
  useEffect(() => {
    if (!weatherCamera.selectedStationId) {
      setStation(null);
      return;
    }

    const fetchStation = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/weathercam');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data: WeatherCameraStation[] = await response.json();
        const found = data.find(
          (s) => s.id === weatherCamera.selectedStationId
        );
        setStation(found || null);
      } catch (error) {
        console.error('Failed to fetch station:', error);
        setStation(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStation();
  }, [weatherCamera.selectedStationId]);

  const handleClose = () => {
    setSelectedWeatherCamera(null);
    setFullscreenPreset(null);
  };

  const isDark = theme === 'dark';
  const bgClass = isDark
    ? 'bg-zinc-900 border-zinc-700'
    : 'bg-white border-zinc-200';
  const textClass = isDark ? 'text-zinc-100' : 'text-zinc-900';
  const textMutedClass = isDark ? 'text-zinc-400' : 'text-zinc-600';

  if (!weatherCamera.selectedStationId || !station) return null;

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal Content */}
        <div
          className={`relative z-10 w-full max-w-4xl max-h-[90vh] rounded-lg shadow-2xl overflow-hidden border transition-colors ${bgClass}`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between p-4 border-b ${
              isDark ? 'border-zinc-700' : 'border-zinc-200'
            }`}
          >
            <div className="flex-1">
              <h2 className={`text-lg font-semibold ${textClass}`}>
                {station.name}
              </h2>
              <p className={`text-sm ${textMutedClass}`}>
                Päivitetty:{' '}
                {new Date(station.lastUpdate).toLocaleTimeString('fi-FI', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <button
              onClick={handleClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-300'
                  : 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
              }`}
              aria-label="Sulje modal"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>

          {/* Content */}
          <div
            className={`p-4 overflow-y-auto max-h-[calc(90vh-100px)] ${
              isDark ? 'bg-zinc-900' : 'bg-zinc-50'
            }`}
          >
            {loading ? (
              <div className={`flex items-center justify-center py-8 ${textMutedClass}`}>
                <p>Ladataan kuvia...</p>
              </div>
            ) : station.presets.length === 0 ? (
              <div className={`flex items-center justify-center py-8 ${textMutedClass}`}>
                <p>Ei kamerakuvia saatavilla</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {station.presets.map((preset) => (
                  <div
                    key={preset.presetId}
                    className="relative group overflow-hidden rounded-lg bg-black"
                  >
                    <img
                      src={preset.imageUrl}
                      alt={`Kamera ${preset.presetNumber}`}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.alt =
                          'Kuva ei ole saatavilla';
                        e.currentTarget.classList.add('opacity-30');
                      }}
                      className={`w-full h-48 object-cover cursor-pointer transition-opacity group-hover:opacity-90`}
                      onClick={() => setFullscreenPreset(preset.presetId)}
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                      Kamera {preset.presetNumber}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className={`p-3 border-t text-xs ${textMutedClass} ${
              isDark ? 'border-zinc-700 bg-zinc-800/50' : 'border-zinc-200 bg-zinc-50'
            }`}
          >
            <p>Lähde: Digitraffic kelikamerat</p>
          </div>
        </div>
      </div>

      {/* Fullscreen Overlay */}
      {fullscreenPreset && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black"
          onClick={() => setFullscreenPreset(null)}
        >
          <img
            src={
              station.presets.find((p) => p.presetId === fullscreenPreset)
                ?.imageUrl
            }
            alt="Fullscreen"
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              e.currentTarget.alt = 'Kuva ei ole saatavilla';
            }}
          />
          <button
            className="absolute top-4 right-4 text-white text-2xl p-2 hover:bg-black/50 rounded transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setFullscreenPreset(null);
            }}
            aria-label="Sulje fullscreen"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
