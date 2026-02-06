'use client';

import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import { LAYER_GROUPS } from '@/lib/constants';

export default function ActiveGroupChip() {
  const { theme, activeGroup, getActiveLayerCount } = useUnifiedFilters();
  const isDark = theme === 'dark';

  if (!activeGroup) return null;

  const group = LAYER_GROUPS[activeGroup];
  const count = getActiveLayerCount(activeGroup);

  if (count === 0) return null;

  return (
    <div
      className={`fixed bottom-16 left-1/2 -translate-x-1/2 z-20 lg:hidden px-4 py-2 rounded-full shadow-lg backdrop-blur-xl transition-all ${
        isDark
          ? 'bg-zinc-900/90 border border-white/10'
          : 'bg-white/90 border border-black/10'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">{group.icon}</span>
        <span className={`text-xs font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
          {group.label}
        </span>
        <span className="text-xs" style={{ color: group.color }}>
          &middot; {count} layer{count > 1 ? 'iä' : ''}
        </span>
      </div>
    </div>
  );
}
