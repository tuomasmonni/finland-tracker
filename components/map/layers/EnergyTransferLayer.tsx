'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Map as MapboxMap } from 'mapbox-gl';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import type { EnergyOverview, CrossBorderTransfer } from '@/lib/data/fingrid/client';

interface EnergyTransferLayerProps {
  map: MapboxMap;
}

const REFRESH_INTERVAL = 300_000; // 5 min

// Rajayhteyksien koordinaatit: [Suomen pää, toisen maan pää]
const CONNECTIONS: Record<string, { fi: [number, number]; foreign: [number, number]; label: string }> = {
  'FI-SE1': { fi: [24.6, 65.9], foreign: [23.7, 65.8], label: 'SE1' },
  'FI-SE3': { fi: [21.51, 61.13], foreign: [18.13, 60.41], label: 'SE3' },
  'FI-EE':  { fi: [24.95, 60.3], foreign: [24.55, 59.4], label: 'EE' },
  'FI-NO':  { fi: [27.02, 69.07], foreign: [28.05, 70.07], label: 'NO' },
};

const SOURCE_PREFIX = 'energy-transfer';
const LAYER_LINE_PREFIX = 'energy-transfer-line';
const LAYER_ARROW_PREFIX = 'energy-transfer-arrow';
const LAYER_LABEL_PREFIX = 'energy-transfer-label';

function getLineGeoJSON(
  transfer: CrossBorderTransfer,
  conn: { fi: [number, number]; foreign: [number, number] }
): GeoJSON.Feature<GeoJSON.LineString> {
  const isExport = transfer.value >= 0;
  // Nuoli osoittaa virrankohteeseen: vienti = Suomesta ulos, tuonti = ulkomailta Suomeen
  const from = isExport ? conn.fi : conn.foreign;
  const to = isExport ? conn.foreign : conn.fi;

  return {
    type: 'Feature',
    properties: {
      value: transfer.value,
      absValue: Math.abs(transfer.value),
      isExport,
      label: `${Math.abs(Math.round(transfer.value))} MW`,
    },
    geometry: {
      type: 'LineString',
      coordinates: [from, to],
    },
  };
}

function getMidpoint(
  conn: { fi: [number, number]; foreign: [number, number] }
): [number, number] {
  return [
    (conn.fi[0] + conn.foreign[0]) / 2,
    (conn.fi[1] + conn.foreign[1]) / 2,
  ];
}

function getLabelGeoJSON(
  transfer: CrossBorderTransfer,
  conn: { fi: [number, number]; foreign: [number, number]; label: string }
): GeoJSON.Feature<GeoJSON.Point> {
  const mid = getMidpoint(conn);
  const isExport = transfer.value >= 0;
  const arrow = isExport ? '→' : '←';

  return {
    type: 'Feature',
    properties: {
      label: `${conn.label} ${arrow} ${Math.abs(Math.round(transfer.value))} MW`,
      isExport,
    },
    geometry: {
      type: 'Point',
      coordinates: mid,
    },
  };
}

export default function EnergyTransferLayer({ map }: EnergyTransferLayerProps) {
  const { energy } = useUnifiedFilters();
  const [transfers, setTransfers] = useState<CrossBorderTransfer[]>([]);
  const layersAdded = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/fingrid');
      if (!res.ok) return;
      const data: EnergyOverview = await res.json();
      if (data.transfers) {
        setTransfers(data.transfers);
      }
    } catch {
      // silent fail — EnergyWidget shows errors
    }
  }, []);

  // Polling
  useEffect(() => {
    if (!energy.layerVisible) return;

    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [energy.layerVisible, fetchData]);

  // Manage map sources & layers
  useEffect(() => {
    if (!map || !energy.layerVisible || transfers.length === 0) {
      // Cleanup when hidden
      if (layersAdded.current) {
        cleanupLayers(map);
        layersAdded.current = false;
      }
      return;
    }

    // Add or update sources & layers for each connection
    for (const transfer of transfers) {
      const conn = CONNECTIONS[transfer.connection];
      if (!conn) continue;

      const sourceLineId = `${SOURCE_PREFIX}-line-${transfer.connection}`;
      const sourceLabelId = `${SOURCE_PREFIX}-label-${transfer.connection}`;
      const lineLayerId = `${LAYER_LINE_PREFIX}-${transfer.connection}`;
      const arrowLayerId = `${LAYER_ARROW_PREFIX}-${transfer.connection}`;
      const labelLayerId = `${LAYER_LABEL_PREFIX}-${transfer.connection}`;

      const lineFeature = getLineGeoJSON(transfer, conn);
      const labelFeature = getLabelGeoJSON(transfer, conn);

      const lineCollection: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [lineFeature],
      };
      const labelCollection: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [labelFeature],
      };

      // Nuolen paksuus: min 2, max 8, skaalattu absoluuttisen arvon mukaan
      const absVal = Math.abs(transfer.value);
      const lineWidth = Math.max(2, Math.min(8, 2 + (absVal / 2000) * 6));
      const isExport = transfer.value >= 0;
      const lineColor = isExport ? '#22c55e' : '#ef4444'; // vihreä vienti, punainen tuonti

      if (map.getSource(sourceLineId)) {
        // Update existing source
        (map.getSource(sourceLineId) as mapboxgl.GeoJSONSource).setData(lineCollection);
        (map.getSource(sourceLabelId) as mapboxgl.GeoJSONSource).setData(labelCollection);

        // Update line width & color
        map.setPaintProperty(lineLayerId, 'line-color', lineColor);
        map.setPaintProperty(lineLayerId, 'line-width', lineWidth);
        map.setPaintProperty(arrowLayerId, 'line-color', lineColor);
      } else {
        // Add new source + layers
        map.addSource(sourceLineId, { type: 'geojson', data: lineCollection });
        map.addSource(sourceLabelId, { type: 'geojson', data: labelCollection });

        map.addLayer({
          id: lineLayerId,
          type: 'line',
          source: sourceLineId,
          paint: {
            'line-color': lineColor,
            'line-width': lineWidth,
            'line-opacity': 0.85,
          },
          layout: {
            'line-cap': 'round',
          },
        });

        // Arrow layer (nuolen kärki)
        map.addLayer({
          id: arrowLayerId,
          type: 'line',
          source: sourceLineId,
          paint: {
            'line-color': lineColor,
            'line-width': lineWidth + 2,
            'line-opacity': 0.9,
          },
          layout: {
            'line-cap': 'butt',
          },
        });

        // Label layer (MW-lukema)
        map.addLayer({
          id: labelLayerId,
          type: 'symbol',
          source: sourceLabelId,
          layout: {
            'text-field': ['get', 'label'],
            'text-size': 12,
            'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': 'rgba(0,0,0,0.8)',
            'text-halo-width': 1.5,
          },
        });
      }
    }

    layersAdded.current = true;

    return () => {
      // Cleanup on unmount
      cleanupLayers(map);
      layersAdded.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, energy.layerVisible, transfers]);

  return null;
}

function cleanupLayers(map: MapboxMap) {
  if (!map) return;
  for (const connKey of Object.keys(CONNECTIONS)) {
    const lineLayerId = `${LAYER_LINE_PREFIX}-${connKey}`;
    const arrowLayerId = `${LAYER_ARROW_PREFIX}-${connKey}`;
    const labelLayerId = `${LAYER_LABEL_PREFIX}-${connKey}`;
    const sourceLineId = `${SOURCE_PREFIX}-line-${connKey}`;
    const sourceLabelId = `${SOURCE_PREFIX}-label-${connKey}`;

    try {
      if (map.getLayer(labelLayerId)) map.removeLayer(labelLayerId);
      if (map.getLayer(arrowLayerId)) map.removeLayer(arrowLayerId);
      if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
      if (map.getSource(sourceLineId)) map.removeSource(sourceLineId);
      if (map.getSource(sourceLabelId)) map.removeSource(sourceLabelId);
    } catch {
      // Map might be destroyed
    }
  }
}
