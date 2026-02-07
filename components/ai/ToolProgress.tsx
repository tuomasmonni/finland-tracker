/**
 * Tool Progress - Loading indicator per active tool
 */

'use client';

const TOOL_LABELS: Record<string, string> = {
  query_municipal_data: 'Haetaan kuntadataa...',
  create_map_layer: 'Luodaan karttatasoa...',
  create_insight: 'Luodaan analyysejä...',
  create_table: 'Luodaan taulukkoa...',
};

interface ToolProgressProps {
  activeTools: Map<string, string>;
}

export default function ToolProgress({ activeTools }: ToolProgressProps) {
  if (activeTools.size === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 px-4 py-2">
      {Array.from(activeTools.entries()).map(([id, toolName]) => (
        <div
          key={id}
          className="flex items-center gap-2 text-xs text-blue-300 animate-pulse"
        >
          <div className="w-3 h-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
          <span>{TOOL_LABELS[toolName] || `Suoritetaan ${toolName}...`}</span>
        </div>
      ))}
    </div>
  );
}
