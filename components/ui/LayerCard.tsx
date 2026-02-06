'use client';

import { useState, ReactNode } from 'react';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import { LAYER_INFO, type LayerKey } from '@/lib/constants';

interface LayerCardProps {
  layerKey: LayerKey;
  isVisible: boolean;
  onToggle: (visible: boolean) => void;
  statusText?: string;
  children?: ReactNode;
}

export default function LayerCard({ layerKey, isVisible, onToggle, statusText, children }: LayerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { theme } = useUnifiedFilters();
  const isDark = theme === 'dark';
  const info = LAYER_INFO[layerKey];

  const hasSettings = !!children;

  return (
    <div
      className={`rounded-xl transition-all ${
        isDark
          ? 'bg-white/5 hover:bg-white/[0.08]'
          : 'bg-black/5 hover:bg-black/[0.08]'
      }`}
    >
      {/* Header row */}
      <div
        className={`flex items-center gap-3 px-3 py-2.5 ${hasSettings ? 'cursor-pointer' : ''}`}
        onClick={() => hasSettings && setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (hasSettings && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        role={hasSettings ? 'button' : undefined}
        tabIndex={hasSettings ? 0 : undefined}
        aria-expanded={hasSettings ? expanded : undefined}
        aria-label={hasSettings ? `${info.label} asetukset` : undefined}
      >
        <span className="text-base flex-shrink-0">{info.icon}</span>
        <div className="flex-1 min-w-0">
          <span className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
            {info.label}
          </span>
          {(statusText || info.description) && (
            <p className={`text-xs truncate ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
              {statusText || info.description}
            </p>
          )}
        </div>

        {/* Toggle switch */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(!isVisible);
          }}
          className={`toggle-switch relative w-10 h-6 rounded-full flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
            isVisible
              ? 'bg-green-500 hover:bg-green-600'
              : isDark
              ? 'bg-zinc-700 hover:bg-zinc-600'
              : 'bg-zinc-300 hover:bg-zinc-400'
          }`}
          aria-label={`${info.label} ${isVisible ? 'pois' : 'päälle'}`}
          aria-checked={isVisible}
          role="switch"
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
              isVisible ? 'translate-x-[18px]' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Expandable settings */}
      {hasSettings && expanded && (
        <div className={`px-3 pb-3 pt-1 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
          <div className="layer-settings-enter">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
