# Tilannekuva.online Phase 1 - Quick Reference

## 📍 What's New

Three new real-time data sources are integrated:

| Source | Updates | Coverage | Features |
|--------|---------|----------|----------|
| **FMI Weather** | 5 min | All Finland | Temperature, wind, precipitation, humidity, pressure |
| **HSL Transit** | 15 sec | Helsinki region | Bus, tram, metro positions (1000-2000 vehicles) |
| **Road Weather** | 5 min | Major roads | Road conditions, surface temp, visibility, wind |

## 🔌 API Endpoints

```bash
GET /api/weather        # FMI weather observations (5000 points)
GET /api/transit        # HSL vehicle positions (1000-2000 points)
GET /api/road-weather   # Digitraffic road weather (500 points)
```

All return GeoJSON FeatureCollections.

## 🎛️ Filter Controls (UnifiedFilterContext)

```typescript
// Weather
const { weather } = useUnifiedFilters();
weather.layerVisible        // boolean
weather.metric             // 'temperature' | 'wind' | 'precipitation'
setWeatherLayerVisible(bool)
setWeatherMetric(metric)

// Transit
const { transit } = useUnifiedFilters();
transit.layerVisible       // boolean
transit.vehicleTypes       // ['bus', 'tram', 'metro', 'train']
setTransitLayerVisible(bool)
setTransitVehicleTypes(types)
toggleTransitVehicleType(type)

// Road Weather
const { roadWeather } = useUnifiedFilters();
roadWeather.layerVisible   // boolean
setRoadWeatherLayerVisible(bool)
```

## 🗺️ Event Categories

```typescript
// In lib/constants.ts - EVENT_CATEGORIES

weather: {
  color: '#06b6d4',
  icon: 'cloud',
  label: 'Sää',
  emoji: '⛈️',
}

transit: {
  color: '#10b981',
  icon: 'bus',
  label: 'Joukkoliikenne',
  emoji: '🚌',
}

road_weather: {
  color: '#8b5cf6',
  icon: 'thermometer',
  label: 'Tiesää',
  emoji: '🌡️',
}
```

## 📦 Data Structure

All sources return `NormalizedEvent` objects:

```typescript
interface NormalizedEvent {
  id: string;                                    // Unique ID
  type: 'weather' | 'transit' | 'road_weather'; // Event type
  category: 'weather' | 'transit' | 'road_weather';
  title: string;                                 // Display title
  description: string;                          // Short description
  location: {
    coordinates: [number, number];              // [lon, lat]
    name: string;
  };
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  source: string;                               // 'Ilmatieteenlaitos', 'HSL', etc.
  metadata?: {                                  // Source-specific data
    temperature?: number;
    windSpeed?: number;
    vehicleType?: 'bus' | 'tram' | 'metro' | 'train';
    roadCondition?: string;
    // ... etc
  };
}
```

## 🚀 Frontend Implementation Tasks

### 1. Create Layer Components

```typescript
// components/map/layers/WeatherLayer.tsx
export function WeatherLayer({ map, onEventSelected }: LayerProps) {
  // Fetch, render weather points
  // Support metric filtering (temperature/wind/precipitation)
}

// components/map/layers/TransitLayer.tsx
export function TransitLayer({ map, onEventSelected }: LayerProps) {
  // Fetch, render vehicle positions with clustering
  // Support vehicle type filtering
}

// components/map/layers/RoadWeatherLayer.tsx
export function RoadWeatherLayer({ map, onEventSelected }: LayerProps) {
  // Fetch, render road weather stations
}
```

See `docs/LAYER-COMPONENT-TEMPLATE.md` for full implementation guide.

### 2. Update FilterPanel

Add accordions in `components/ui/FilterPanel.tsx`:

```typescript
<Accordion title="Sää">
  <Toggle layer="weather" />
  <Select metric={['temperature', 'wind', 'precipitation']} />
</Accordion>

<Accordion title="Joukkoliikenne">
  <Toggle layer="transit" />
  <CheckboxGroup types={['bus', 'tram', 'metro', 'train']} />
</Accordion>

<Accordion title="Tiesää">
  <Toggle layer="road-weather" />
</Accordion>
```

### 3. Update Legend

Add entries in `components/ui/Legend.tsx`:

```typescript
const newLayers = [
  { id: 'weather', label: 'Sää', color: '#06b6d4', emoji: '⛈️' },
  { id: 'transit', label: 'Joukkoliikenne', color: '#10b981', emoji: '🚌' },
  { id: 'road-weather', label: 'Tiesää', color: '#8b5cf6', emoji: '🌡️' },
];
```

### 4. Update MapContainer

Import and render new layer components:

```typescript
import { WeatherLayer } from '@/components/map/layers/WeatherLayer';
import { TransitLayer } from '@/components/map/layers/TransitLayer';
import { RoadWeatherLayer } from '@/components/map/layers/RoadWeatherLayer';

// In component:
{filters.weather.layerVisible && <WeatherLayer map={map} />}
{filters.transit.layerVisible && <TransitLayer map={map} />}
{filters.roadWeather.layerVisible && <RoadWeatherLayer map={map} />}
```

## 🔍 Data Source Details

### FMI Weather (`/api/weather`)

**Endpoint:** `https://opendata.fmi.fi/wfs`
**Format:** GeoJSON (converted from WFS XML)
**Update:** 5 minutes
**Count:** ~5000 stations

**Metadata available:**
```typescript
metadata: {
  temperature: number,        // °C
  windSpeed: number,         // m/s
  humidity: number,          // %
  precipitation: number,     // mm
  pressure: number,          // hPa
  stationId: string,
}
```

**Severity:**
- High: <-15°C, >30°C, wind >10m/s, rain >5mm
- Medium: <0°C, wind >5m/s, rain >0
- Low: Other

### HSL Transit (`/api/transit`)

**Endpoint:** `https://realtime.hsl.fi/realtime/vehicle-positions/v2/hsl`
**Format:** GeoJSON (JSON API)
**Update:** 15 seconds
**Count:** 1000-2000 vehicles (varies)
**Coverage:** Helsinki region only

**Metadata available:**
```typescript
metadata: {
  vehicleId: string,
  routeId: string,
  tripId: string,
  vehicleType: 'bus' | 'tram' | 'metro' | 'train',
  bearing: number,           // Compass bearing
  speed: number,             // m/s
}
```

**Vehicle Type Mapping:**
- Route starting with "1" → Tram (Ratikka)
- Route starting with "2" → Metro
- Route starting with "3" → Train (Juna)
- Other → Bus (Bussi)

### Road Weather (`/api/road-weather`)

**Endpoint:** `https://tie.digitraffic.fi/api/weather/v1/stations/data`
**Format:** GeoJSON
**Update:** 5 minutes
**Count:** ~500 stations
**Coverage:** Major roads

**Metadata available:**
```typescript
metadata: {
  stationId: string,
  airTemperature: number,         // °C
  surfaceTemperature: number,     // °C
  roadCondition: string,          // e.g., 'DRY', 'MOIST', 'WET', 'SLIPPERY', 'ICY'
  visibility: number,             // meters
  windSpeed: number,              // m/s
}
```

**Severity:**
- High: Ice/snow, visibility <200m, wind >15m/s
- Medium: Slippery, visibility <500m, wind >10m/s, extreme temps
- Low: Other

## 🎨 Color Scheme

```typescript
weather:     '#06b6d4'  // Cyan
transit:     '#10b981'  // Emerald green
road_weather: '#8b5cf6' // Purple
```

## ⚡ Performance Tips

### Weather Layer
- No clustering needed (sparse data)
- Simple circle markers
- Color interpolation for temperature

### Transit Layer
- **MUST use clustering** (1000+ points)
- Enable cluster zoom at level 14
- Cluster radius 50
- Show cluster counts

### Road Weather Layer
- No clustering (sparse data)
- Circle markers with stroke
- Hover shows temperature

## 🔗 Type Imports

```typescript
import type { NormalizedEvent, EventFeatureCollection } from '@/lib/types';
import { EVENT_CATEGORIES, POLLING_INTERVALS } from '@/lib/constants';
import { useUnifiedFilters } from '@/lib/contexts/UnifiedFilterContext';
```

## 🐛 Common Issues

**Q: API returns 500 error?**
A: Check that dependencies are installed: `npm install`

**Q: Layer not showing?**
A: Verify filter state is enabled:
```typescript
const { [source]: filters } = useUnifiedFilters();
if (!filters.layerVisible) return null; // Hidden
```

**Q: Performance lag with transit?**
A: Implement clustering. See `docs/LAYER-COMPONENT-TEMPLATE.md` for example.

**Q: Wrong coordinates?**
A: Remember GeoJSON uses `[longitude, latitude]` not `[latitude, longitude]`

**Q: Stale data?**
A: Check cache headers and polling intervals. Each source has different TTL.

## 📊 Checklist for Frontend Dev

- [ ] Install dependencies: `npm install`
- [ ] Start dev server: `npm run dev`
- [ ] Test API endpoints in browser
- [ ] Create WeatherLayer component
- [ ] Create TransitLayer component
- [ ] Create RoadWeatherLayer component
- [ ] Update FilterPanel UI
- [ ] Update Legend component
- [ ] Add layers to MapContainer
- [ ] Test filter toggles
- [ ] Test performance with full data
- [ ] Test mobile responsiveness

## 📚 Full Documentation

- Main guide: `docs/PHASE1-IMPLEMENTATION.md`
- Layer templates: `docs/LAYER-COMPONENT-TEMPLATE.md`
- Status: `IMPLEMENTATION_STATUS.md`

## ✨ Next Phase Ideas

- **Phase 2:** Geolocalized news, population statistics, housing prices
- **Phase 3:** Energy generation, healthcare access, water quality

---

**Last Updated:** 2026-02-04
**Backend Status:** ✅ Complete
**Frontend Status:** ⏳ Ready for implementation
