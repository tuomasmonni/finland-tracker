/**
 * ArtifactLayer - Dynamic Mapbox layer for AI-generated GeoJSON choropleths
 * Renders MapLayerArtifacts from the AI chat as interactive map layers
 */

'use client';

import { useEffect, useRef } from 'react';
import type mapboxgl from 'mapbox-gl';
import { useAIChat } from '@/lib/contexts/AIChatContext';

interface ArtifactLayerProps {
  map: mapboxgl.Map;
}

function getSourceId(artifactId: string) {
  return `ai-artifact-${artifactId}`;
}

function getFillLayerId(artifactId: string) {
  return `ai-artifact-fill-${artifactId}`;
}

function getOutlineLayerId(artifactId: string) {
  return `ai-artifact-outline-${artifactId}`;
}

export default function ArtifactLayer({ map }: ArtifactLayerProps) {
  const { activeMapArtifacts } = useAIChat();
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const hoveredStateIdRef = useRef<{ sourceId: string; id: number } | null>(null);
  const prevArtifactIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!map) return;

    const currentIds = new Set(activeMapArtifacts.map((a) => a.id));
    const prevIds = prevArtifactIdsRef.current;

    // Remove layers for artifacts that are no longer active
    for (const prevId of prevIds) {
      if (!currentIds.has(prevId)) {
        const fillId = getFillLayerId(prevId);
        const outlineId = getOutlineLayerId(prevId);
        const sourceId = getSourceId(prevId);

        if (map.getLayer(fillId)) map.removeLayer(fillId);
        if (map.getLayer(outlineId)) map.removeLayer(outlineId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      }
    }

    // Add or update layers for active artifacts
    for (const artifact of activeMapArtifacts) {
      const sourceId = getSourceId(artifact.id);
      const fillId = getFillLayerId(artifact.id);
      const outlineId = getOutlineLayerId(artifact.id);

      const existingSource = map.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined;

      if (existingSource) {
        // Update existing source data
        existingSource.setData(artifact.geojson as GeoJSON.FeatureCollection);
      } else {
        // Add new source and layers
        map.addSource(sourceId, {
          type: 'geojson',
          data: artifact.geojson as GeoJSON.FeatureCollection,
          generateId: true,
        });

        // Build color expression from color scale and colorBin property
        const colorExpr: mapboxgl.Expression = [
          'match',
          ['get', 'colorBin'],
          0, artifact.colorScale[0] || '#2dc653',
          1, artifact.colorScale[1] || '#a3d977',
          2, artifact.colorScale[2] || '#f5e642',
          3, artifact.colorScale[3] || '#f59e42',
          4, artifact.colorScale[4] || '#e63946',
          '#888888',
        ];

        // Fill layer
        map.addLayer({
          id: fillId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': colorExpr,
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              0.9,
              artifact.style.fillOpacity,
            ],
          },
        });

        // Outline layer
        map.addLayer({
          id: outlineId,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              '#ffffff',
              artifact.style.outlineColor,
            ],
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              2,
              artifact.style.outlineWidth,
            ],
          },
        });
      }
    }

    prevArtifactIdsRef.current = currentIds;
  }, [map, activeMapArtifacts]);

  // Hover and popup handlers
  useEffect(() => {
    if (!map || activeMapArtifacts.length === 0) return;

    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      // Check all active artifact fill layers
      for (const artifact of activeMapArtifacts) {
        const fillId = getFillLayerId(artifact.id);
        const sourceId = getSourceId(artifact.id);

        if (!map.getLayer(fillId)) continue;

        const features = map.queryRenderedFeatures(e.point, { layers: [fillId] });

        if (features.length > 0) {
          map.getCanvas().style.cursor = 'pointer';

          // Clear previous hover
          if (hoveredStateIdRef.current) {
            map.setFeatureState(
              { source: hoveredStateIdRef.current.sourceId, id: hoveredStateIdRef.current.id },
              { hover: false }
            );
          }

          const feature = features[0];
          const featureId = feature.id as number;

          hoveredStateIdRef.current = { sourceId, id: featureId };
          map.setFeatureState({ source: sourceId, id: featureId }, { hover: true });

          // Show popup
          const props = feature.properties;
          if (props) {
            if (popupRef.current) popupRef.current.remove();

            const mapboxgl = require('mapbox-gl');
            popupRef.current = new mapboxgl.Popup({
              closeButton: false,
              closeOnClick: false,
              className: 'ai-artifact-popup',
              offset: 10,
            })
              .setLngLat(e.lngLat)
              .setHTML(
                `<div style="background:rgba(24,24,27,0.95);color:#e4e4e7;padding:8px 12px;border-radius:8px;font-size:12px;border:1px solid rgba(63,63,70,0.6);backdrop-filter:blur(8px)">
                  <div style="font-weight:600;margin-bottom:2px">${props.nimi || ''}</div>
                  <div style="color:#a1a1aa">${props.label || ''}</div>
                </div>`
              )
              .addTo(map);
          }
          return; // Found a feature, stop checking other layers
        }
      }

      // No features found under cursor
      map.getCanvas().style.cursor = '';
      if (hoveredStateIdRef.current) {
        map.setFeatureState(
          { source: hoveredStateIdRef.current.sourceId, id: hoveredStateIdRef.current.id },
          { hover: false }
        );
        hoveredStateIdRef.current = null;
      }
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    };

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = '';
      if (hoveredStateIdRef.current) {
        map.setFeatureState(
          { source: hoveredStateIdRef.current.sourceId, id: hoveredStateIdRef.current.id },
          { hover: false }
        );
        hoveredStateIdRef.current = null;
      }
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    };

    map.on('mousemove', handleMouseMove);
    map.on('mouseleave', handleMouseLeave);

    return () => {
      map.off('mousemove', handleMouseMove);
      map.off('mouseleave', handleMouseLeave);
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    };
  }, [map, activeMapArtifacts]);

  // Cleanup all layers on unmount
  useEffect(() => {
    return () => {
      if (!map) return;
      for (const id of prevArtifactIdsRef.current) {
        const fillId = getFillLayerId(id);
        const outlineId = getOutlineLayerId(id);
        const sourceId = getSourceId(id);
        try {
          if (map.getLayer(fillId)) map.removeLayer(fillId);
          if (map.getLayer(outlineId)) map.removeLayer(outlineId);
          if (map.getSource(sourceId)) map.removeSource(sourceId);
        } catch {
          // Map might be destroyed
        }
      }
    };
  }, [map]);

  return null;
}
