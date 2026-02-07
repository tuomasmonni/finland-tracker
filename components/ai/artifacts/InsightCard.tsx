/**
 * Insight Card - Key finding card with color-coded severity
 */

'use client';

import type { InsightArtifact } from '@/lib/ai/types';

const SEVERITY_STYLES = {
  positive: { bg: 'bg-emerald-900/40', border: 'border-emerald-700/50', icon: '+', text: 'text-emerald-300' },
  neutral: { bg: 'bg-zinc-800/60', border: 'border-zinc-600/50', icon: '~', text: 'text-zinc-300' },
  negative: { bg: 'bg-red-900/40', border: 'border-red-700/50', icon: '!', text: 'text-red-300' },
  info: { bg: 'bg-blue-900/40', border: 'border-blue-700/50', icon: 'i', text: 'text-blue-300' },
};

interface InsightCardProps {
  artifact: InsightArtifact;
}

export default function InsightCard({ artifact }: InsightCardProps) {
  return (
    <div className="space-y-2 my-2">
      {artifact.findings.map((finding, i) => {
        const style = SEVERITY_STYLES[finding.severity] || SEVERITY_STYLES.info;
        return (
          <div
            key={i}
            className={`${style.bg} ${style.border} border rounded-lg p-3`}
          >
            <div className="flex items-start gap-2">
              <span className={`${style.text} text-sm font-bold mt-0.5 w-5 h-5 rounded-full bg-black/20 flex items-center justify-center flex-shrink-0`}>
                {style.icon}
              </span>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-medium text-zinc-200">
                    {finding.title}
                  </span>
                  <span className={`text-sm font-bold ${style.text}`}>
                    {finding.value}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">{finding.description}</p>
              </div>
            </div>
          </div>
        );
      })}
      {artifact.dataSources.length > 0 && (
        <p className="text-[10px] text-zinc-500 px-1">
          Lähteet: {artifact.dataSources.join(', ')}
        </p>
      )}
    </div>
  );
}
