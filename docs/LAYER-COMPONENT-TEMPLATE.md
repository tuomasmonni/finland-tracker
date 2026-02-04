# Layer Component Template

Guide for implementing map layer components for new data sources.

## Template Structure

Each layer component follows this pattern:

```typescript
// components/map/layers/[Source]Layer.tsx

'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
import type { EventFeatureCollection } from '@/lib/types';
import { POLLING_INTERVALS } from '@/lib/constants';

interface LayerProps {
  map: mapboxgl.Map;
  onEventSelected?: (eventId: string) => void;
}

export function [Source]Layer({ map, onEventSelected }: LayerProps) {
  const { [source]: filters, theme } = useUnifiedFilters();
  const dataRef = useRef<EventFeatureCollection | null>(null);
  const pollingRef = useRef<NodeJS.Timeout>();

  // ========== DATA FETCHING ==========

  const fetchData = async () => {
    try {
      const response = await fetch('/api/[source]');
      if (!response.ok) throw new Error('API error');

      const data: EventFeatureCollection = await response.json();
      dataRef.current = data;

      // Update map
      updateMapLayer(data);
    } catch (error) {
      console.error('[Source] fetch error:', error);
    }
  };

  // ========== MAP LAYER UPDATE ==========

  const updateMapLayer = (data: EventFeatureCollection) => {
    const sourceId = '[source]-source';
    const layerId = '[source]-layer';

    // Remove existing layer
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }

    // Add source
    map.addSource(sourceId, {
      type: 'geojson',
      data: data,
      cluster: true,  // Enable clustering for performance
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });

    // Add layer
    map.addLayer({
      id: layerId,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-color': '#[color-hex]',  // From EVENT_CATEGORIES
        'circle-radius': 6,
        'circle-opacity': 0.8,
      },
    });

    // Add click handler
    map.on('click', layerId, (e) => {
      const properties = e.features?.[0]?.properties;
      if (properties?.id) {
        onEventSelected?.(properties.id);
      }
    });

    // Change cursor on hover
    map.on('mouseenter', layerId, () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', layerId, () => {
      map.getCanvas().style.cursor = '';
    });
  };

  // ========== SETUP & CLEANUP ==========

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Setup polling
    pollingRef.current = setInterval(fetchData, POLLING_INTERVALS.[source]);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [map]);

  // ========== VISIBILITY TOGGLE ==========

  useEffect(() => {
    const layerId = '[source]-layer';
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(
        layerId,
        'visibility',
        filters.layerVisible ? 'visible' : 'none'
      );
    }
  }, [filters.layerVisible, map]);

  return null; // Layer is rendered directly on map
}
```

## Implementation Examples

### 1. WeatherLayer

```typescript
// components/map/layers/WeatherLayer.tsx

const updateMapLayer = (data: EventFeatureCollection) => {
  const sourceId = 'weather-source';
  const layerId = 'weather-layer';

  // ... setup code ...

  // Add layer with temperature color coding
  map.addLayer({
    id: layerId,
    type: 'circle',
    source: sourceId,
    paint: {
      'circle-color': [
        'interpolate',
        ['linear'],
        ['get', 'temperature'],  // From metadata
        -30, '#0000ff',          // Blue: cold
        0, '#00ffff',            // Cyan: freezing
        15, '#00ff00',           // Green: moderate
        30, '#ff0000',           // Red: hot
      ],
      'circle-radius': 7,
      'circle-opacity': 0.7,
    },
  });
};
```

### 2. TransitLayer (with clustering)

```typescript
// components/map/layers/TransitLayer.tsx

const updateMapLayer = (data: EventFeatureCollection) => {
  const sourceId = 'transit-source';
  const layerId = 'transit-layer';

  // ... add source with clustering ...

  // Base layer (unclustered points)
  map.addLayer({
    id: layerId,
    type: 'symbol',
    source: sourceId,
    layout: {
      'icon-image': ['get', 'icon-type'],  // Custom icon per vehicle type
      'icon-size': 0.75,
      'icon-allow-overlap': true,
    },
    filter: ['!', ['has', 'point_count']],
  });

  // Clusters layer
  map.addLayer({
    id: `${layerId}-clusters`,
    type: 'circle',
    source: sourceId,
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': '#10b981',
      'circle-radius': ['step', ['get', 'point_count'], 20, 5, 25, 10, 30],
    },
  });

  // Cluster count labels
  map.addLayer({
    id: `${layerId}-cluster-count`,
    type: 'symbol',
    source: sourceId,
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count'],
      'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
      'text-size': 12,
    },
  });
};
```

### 3. RoadWeatherLayer

```typescript
// components/map/layers/RoadWeatherLayer.tsx

const updateMapLayer = (data: EventFeatureCollection) => {
  const sourceId = 'road-weather-source';
  const layerId = 'road-weather-layer';

  // ... setup code ...

  map.addLayer({
    id: layerId,
    type: 'circle',
    source: sourceId,
    paint: {
      'circle-color': ['get', 'color'],  // Set in transform based on condition
      'circle-radius': 8,
      'circle-opacity': 0.8,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    },
  });

  // Add hover effect
  map.on('mouseenter', layerId, (e) => {
    const feature = e.features?.[0];
    if (feature?.properties) {
      // Show tooltip or update detail panel
      const temperature = feature.properties.metadata
        ? JSON.parse(feature.properties.metadata).airTemperature
        : null;
      console.log('Road condition:', feature.properties.description);
      console.log('Temperature:', temperature);
    }
  });
};
```

## Filter Integration

Each layer should respond to filter changes:

```typescript
// Weather metric filtering
useEffect(() => {
  // Update color scale based on metric
  if (map.getLayer('weather-layer')) {
    const colorExpr = filters.metric === 'temperature'
      ? [/* temperature colors */]
      : filters.metric === 'wind'
      ? [/* wind colors */]
      : [/* precipitation colors */];

    map.setPaintProperty('weather-layer', 'circle-color', colorExpr);
  }
}, [filters.metric, map]);

// Transit vehicle type filtering
useEffect(() => {
  if (map.getLayer('transit-layer')) {
    const visibleTypes = filters.vehicleTypes;
    map.setFilter('transit-layer', [
      'in',
      ['get', 'vehicleType'],
      ['literal', visibleTypes],
    ]);
  }
}, [filters.vehicleTypes, map]);
```

## Event Details Integration

Connect layer clicks to detail panel:

```typescript
const handleEventSelected = (eventId: string) => {
  // Find event in dataRef
  const event = dataRef.current?.features.find(
    f => f.properties.id === eventId
  );

  if (event) {
    // Trigger detail panel update
    onEventSelected?.(eventId);

    // Optional: Pan to event
    const coords = event.geometry.coordinates;
    map.flyTo({
      center: [coords[0], coords[1]],
      zoom: 12,
      duration: 1000,
    });
  }
};
```

## Legend Integration

Update `components/ui/Legend.tsx`:

```typescript
const activePointLayers = [
  { id: 'weather', label: 'Sää', color: '#06b6d4', icon: '⛈️' },
  { id: 'transit', label: 'Joukkoliikenne', color: '#10b981', icon: '🚌' },
  { id: 'road-weather', label: 'Tiesää', color: '#8b5cf6', icon: '🌡️' },
];

{activePointLayers.map(layer => (
  filters[layer.id]?.layerVisible && (
    <LegendItem
      key={layer.id}
      icon={layer.icon}
      color={layer.color}
      label={layer.label}
    />
  )
))}
```

## FilterPanel Integration

Update `components/ui/FilterPanel.tsx`:

```typescript
<Accordion title="Sää">
  <Toggle
    checked={filters.weather.layerVisible}
    onChange={(checked) => setWeatherLayerVisible(checked)}
  />
  <Select
    value={filters.weather.metric}
    onChange={(metric) => setWeatherMetric(metric as any)}
    options={[
      { value: 'temperature', label: 'Lämpötila' },
      { value: 'wind', label: 'Tuuli' },
      { value: 'precipitation', label: 'Sade' },
    ]}
  />
</Accordion>

<Accordion title="Joukkoliikenne">
  <Toggle
    checked={filters.transit.layerVisible}
    onChange={(checked) => setTransitLayerVisible(checked)}
  />
  <CheckboxGroup
    items={[
      { value: 'bus', label: 'Bussit' },
      { value: 'tram', label: 'Ratikat' },
      { value: 'metro', label: 'Metro' },
      { value: 'train', label: 'Junat' },
    ]}
    selected={filters.transit.vehicleTypes}
    onChange={(types) => setTransitVehicleTypes(types as any)}
  />
</Accordion>
```

## Performance Optimization Tips

1. **Clustering for Large Datasets**
   - Use for transit (1000+ points)
   - Disable for weather/road-weather

2. **Source Updates**
   - Use `map.getSource().setData()` instead of removing/adding
   - More efficient than full layer recreation

3. **Filters**
   - Use Mapbox filter expressions (client-side)
   - Avoid re-fetching data when filtering

4. **Debouncing**
   - Debounce visibility toggles (300ms)
   - Prevents rapid layer updates

## Testing Checklist

- [ ] Layer appears when toggled on
- [ ] Layer disappears when toggled off
- [ ] Click on feature triggers detail panel
- [ ] Hover cursor changes to pointer
- [ ] Performance acceptable with max data (1000+ features)
- [ ] Layer responsive to filter changes
- [ ] Handles empty data gracefully
- [ ] API error doesn't crash layer
