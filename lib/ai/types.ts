/**
 * AI Data Analyst - Type Definitions
 * Artifact types, SSE events, and tool interfaces
 */

// ============================================
// ARTIFACT TYPES
// ============================================

export interface MapLayerArtifact {
  type: 'map_layer';
  id: string;
  title: string;
  geojson: GeoJSON.FeatureCollection;
  colorScale: string[];
  legendLabels: string[];
  style: {
    fillOpacity: number;
    outlineColor: string;
    outlineWidth: number;
  };
  labelFormat: string;
}

export interface InsightArtifact {
  type: 'insight';
  id: string;
  findings: InsightFinding[];
  dataSources: string[];
}

export interface InsightFinding {
  title: string;
  value: string;
  description: string;
  severity: 'positive' | 'neutral' | 'negative' | 'info';
}

export interface TableArtifact {
  type: 'table';
  id: string;
  title: string;
  columns: { key: string; label: string; unit?: string }[];
  rows: Record<string, string | number>[];
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export type Artifact = MapLayerArtifact | InsightArtifact | TableArtifact;

// ============================================
// SSE EVENT TYPES
// ============================================

export interface SSETextEvent {
  type: 'text';
  text: string;
}

export interface SSEToolStartEvent {
  type: 'tool_start';
  tool: string;
  toolUseId: string;
}

export interface SSEToolEndEvent {
  type: 'tool_end';
  toolUseId: string;
}

export interface SSEArtifactEvent {
  type: 'artifact';
  artifact: Artifact;
}

export interface SSEErrorEvent {
  type: 'error';
  error: string;
}

export interface SSEDoneEvent {
  type: 'done';
}

export type SSEEvent =
  | SSETextEvent
  | SSEToolStartEvent
  | SSEToolEndEvent
  | SSEArtifactEvent
  | SSEErrorEvent
  | SSEDoneEvent;

// ============================================
// CHAT TYPES
// ============================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  artifacts: Artifact[];
  toolsUsed: string[];
  timestamp: Date;
}

// ============================================
// TOOL INPUT/OUTPUT TYPES
// ============================================

export interface QueryMunicipalDataInput {
  datasets: string[];
  municipalities?: string[];
  year?: string;
}

export interface QueryMunicipalDataOutput {
  [slug: string]: {
    kunta_koodi: string;
    kunta_nimi: string;
    vuosi: number;
    [key: string]: unknown;
  }[];
}

export interface CreateMapLayerInput {
  title: string;
  computed_data: {
    kunta_koodi: string;
    value: number;
    label: string;
  }[];
  color_scale: string[];
  label_format: string;
}

export interface CreateInsightInput {
  findings: {
    title: string;
    value: string;
    description: string;
    severity: 'positive' | 'neutral' | 'negative' | 'info';
  }[];
  data_sources: string[];
}

export interface CreateTableInput {
  title: string;
  columns: { key: string; label: string; unit?: string }[];
  rows: Record<string, string | number>[];
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
}

// ============================================
// API REQUEST/RESPONSE
// ============================================

export interface AnalystRequest {
  messages: { role: 'user' | 'assistant'; content: string }[];
}
