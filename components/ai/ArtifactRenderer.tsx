/**
 * Artifact Renderer - Routes artifact type to correct component
 */

'use client';

import type { Artifact } from '@/lib/ai/types';
import MapLayerCard from './artifacts/MapLayerCard';
import InsightCard from './artifacts/InsightCard';
import TableCard from './artifacts/TableCard';

interface ArtifactRendererProps {
  artifact: Artifact;
}

export default function ArtifactRenderer({ artifact }: ArtifactRendererProps) {
  switch (artifact.type) {
    case 'map_layer':
      return <MapLayerCard artifact={artifact} />;
    case 'insight':
      return <InsightCard artifact={artifact} />;
    case 'table':
      return <TableCard artifact={artifact} />;
    default:
      return null;
  }
}
