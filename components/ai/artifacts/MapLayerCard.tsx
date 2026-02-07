/**
 * Map Layer Card - Preview + "Näytä kartalla" button
 */

'use client';

import type { MapLayerArtifact } from '@/lib/ai/types';
import { useAIChat } from '@/lib/contexts/AIChatContext';

interface MapLayerCardProps {
  artifact: MapLayerArtifact;
}

export default function MapLayerCard({ artifact }: MapLayerCardProps) {
  const { activeMapArtifacts, addMapArtifact, removeMapArtifact } = useAIChat();
  const isActive = activeMapArtifacts.some((a) => a.id === artifact.id);

  const handleToggle = () => {
    if (isActive) {
      removeMapArtifact(artifact.id);
    } else {
      addMapArtifact(artifact);
    }
  };

  return (
    <div className="my-2 rounded-lg border border-zinc-700/60 bg-zinc-800/50 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" />
          </svg>
          <span className="text-sm font-medium text-zinc-200 truncate">
            {artifact.title}
          </span>
        </div>
        <span className="text-[10px] text-zinc-500 flex-shrink-0 ml-2">
          {artifact.geojson.features.length} kuntaa
        </span>
      </div>

      {/* Color scale preview */}
      <div className="px-3 pb-1">
        <div className="flex h-2 rounded overflow-hidden">
          {artifact.colorScale.map((color, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[9px] text-zinc-500">{artifact.legendLabels[0]}</span>
          <span className="text-[9px] text-zinc-500">{artifact.legendLabels[artifact.legendLabels.length - 1]}</span>
        </div>
      </div>

      {/* Toggle button */}
      <div className="px-3 pb-2 pt-1">
        <button
          onClick={handleToggle}
          className={`w-full py-1.5 rounded text-xs font-medium transition-colors ${
            isActive
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          {isActive ? 'Piilota kartalta' : 'Näytä kartalla'}
        </button>
      </div>
    </div>
  );
}
