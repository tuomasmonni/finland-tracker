/**
 * Table Card - Sortable ranking table
 */

'use client';

import { useState } from 'react';
import type { TableArtifact } from '@/lib/ai/types';

interface TableCardProps {
  artifact: TableArtifact;
}

export default function TableCard({ artifact }: TableCardProps) {
  const [sortBy, setSortBy] = useState(artifact.sortBy || artifact.columns[0]?.key);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(artifact.sortDirection || 'desc');

  const sortedRows = [...artifact.rows].sort((a, b) => {
    if (!sortBy) return 0;
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return sortDir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  };

  return (
    <div className="my-2 rounded-lg border border-zinc-700/60 bg-zinc-800/50 overflow-hidden">
      <div className="px-3 py-2 border-b border-zinc-700/40">
        <span className="text-sm font-medium text-zinc-200">{artifact.title}</span>
      </div>
      <div className="overflow-x-auto max-h-64">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-zinc-700/40">
              {artifact.columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-3 py-1.5 text-left text-zinc-400 font-medium cursor-pointer hover:text-zinc-200 whitespace-nowrap"
                >
                  {col.label}
                  {col.unit && (
                    <span className="text-zinc-500 ml-1">({col.unit})</span>
                  )}
                  {sortBy === col.key && (
                    <span className="ml-1">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-zinc-800/40 hover:bg-zinc-700/30"
              >
                {artifact.columns.map((col) => (
                  <td key={col.key} className="px-3 py-1.5 text-zinc-300 whitespace-nowrap">
                    {typeof row[col.key] === 'number'
                      ? (row[col.key] as number).toLocaleString('fi-FI', {
                          maximumFractionDigits: 1,
                        })
                      : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
