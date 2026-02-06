'use client';

import { ReactNode } from 'react';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import { LAYER_GROUPS, type LayerGroupKey } from '@/lib/constants';

interface CategoryGroupProps {
  groupKey: LayerGroupKey;
  isActive: boolean;
  onActivate: () => void;
  children: ReactNode;
}

export default function CategoryGroup({ groupKey, isActive, onActivate, children }: CategoryGroupProps) {
  const { theme, getActiveLayerCount } = useUnifiedFilters();
  const isDark = theme === 'dark';
  const group = LAYER_GROUPS[groupKey];
  const activeCount = getActiveLayerCount(groupKey);

  return (
    <div
      className={`transition-all ${
        isActive
          ? `border-l-2`
          : 'border-l-2 border-transparent'
      }`}
      style={isActive ? { borderLeftColor: group.color } : undefined}
    >
      {/* Group header */}
      <button
        onClick={onActivate}
        aria-expanded={isActive}
        aria-label={`${group.label} kategoriaryhmä`}
        className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset ${
          isActive
            ? isDark ? 'bg-white/5' : 'bg-black/5'
            : isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-black/[0.03]'
        }`}
      >
        <span className="text-base">{group.icon}</span>
        <span className={`text-xs font-semibold uppercase tracking-wider flex-1 ${
          isActive
            ? isDark ? 'text-zinc-100' : 'text-zinc-900'
            : isDark ? 'text-zinc-400' : 'text-zinc-600'
        }`}>
          {group.label}
        </span>
        {activeCount > 0 && (
          <span
            className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
            style={{ backgroundColor: group.color }}
          >
            {activeCount}
          </span>
        )}
        <span className={`text-[10px] transition-transform ${isActive ? 'rotate-180' : ''} ${
          isDark ? 'text-zinc-500' : 'text-zinc-400'
        }`}>
          ▼
        </span>
      </button>

      {/* Layers (expanded when active) */}
      <div
        className={`overflow-hidden transition-all duration-200 ease-out ${
          isActive ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
        role="region"
        aria-label={`${group.label} layerit`}
      >
        <div className="px-2 pb-2 pt-1 space-y-1.5">
          {children}
        </div>
      </div>
    </div>
  );
}
