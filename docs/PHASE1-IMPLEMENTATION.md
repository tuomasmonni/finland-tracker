# Tilannekuva.online Phase 1 MVP Implementation

**Status:** ✅ Complete
**Date:** 2026-02-04
**Version:** 1.0

## Overview

Phase 1 adds three real-time data sources to Tilannekuva.online:

1. **FMI Weather Data** - Ilmatieteenlaitos weather observations (~5000 stations)
2. **HSL Transit** - Joukkoliikenne real-time vehicle positions (1000-2000 buses/trams/metros)
3. **Digitraffic Road Weather** - Tiesää stations with road conditions

All three sources require **zero API keys** and follow the existing architectural patterns.

## Architecture

### Pattern Overview

Each data source follows a consistent 5-step pattern:

```
lib/data/[source]/client.ts
  ↓ (fetch + parse raw data)
lib/data/[source]/transform.ts
  ↓ (convert to NormalizedEvent)
app/api/[source]/route.ts
  ↓ (Next.js API endpoint + caching)
components/map/layers/[Source]Layer.tsx
  ↓ (Mapbox layer visualization)
Map Display
```

### File Structure

```
lib/data/
├── weather/
│   ├── client.ts          # FMI WFS API client
│   └── transform.ts       # NormalizedEvent conversion
├── transit/
│   ├── client.ts          # HSL GTFS-RT parsing
│   └── transform.ts       # NormalizedEvent conversion
└── road-weather/
    ├── client.ts          # Digitraffic API client
    └── transform.ts       # NormalizedEvent conversion

app/api/
├── weather/route.ts       # GET /api/weather
├── transit/route.ts       # GET /api/transit
└── road-weather/route.ts  # GET /api/road-weather
```

### Type System

All data sources produce `NormalizedEvent`:

```typescript
interface NormalizedEvent {
  id: string;
  type: 'traffic' | 'roadwork' | 'train' | 'camera' | 'news' | 'weather' | 'transit' | 'road_weather';
  category: EventCategory;
  title: string;
  description: string;
  location: {
    coordinates: [number, number];
    name: string;
    municipality?: string;
    road?: string;
  };
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  source: string;
  metadata?: Record<string, unknown>;
}
```

## Data Sources

### 1. FMI Weather (Ilmatieteenlaitos)

**File:** `lib/data/weather/`

**API:** WFS (Web Feature Service)
- Endpoint: `https://opendata.fmi.fi/wfs`
- Stored Query: `fmi::observations::weather::timevaluepair`
- Authentication: None (open data)
- Update Frequency: 1 minute
- Data Points: Temperature, wind, precipitation, humidity, pressure

**Implementation Details:**

```typescript
// Client: Fetches from FMI WFS, returns FMIWeatherObservation[]
fetchFMIWeather(): Promise<FMIWeatherObservation[]>

// Transform: Converts to NormalizedEvent
transformWeatherObservation(obs: FMIWeatherObservation): NormalizedEvent
```

**Category:** `weather` (already in EVENT_CATEGORIES)
**Severity Logic:**
- High: Freezing (-15°C), hot (+30°C), strong wind (>10 m/s), heavy rain (>5mm)
- Medium: Below 0°C, moderate wind (>5 m/s), light rain
- Low: Normal conditions

**API Response:** `/api/weather`
- Returns: GeoJSON FeatureCollection with ~5000 point features
- Cache: 5 minutes (TTL: 300s)

### 2. HSL Transit (Joukkoliikenne)

**File:** `lib/data/transit/`

**API:** GTFS-Realtime (JSON variant available)
- Endpoint: `https://realtime.hsl.fi/realtime/vehicle-positions/v2/hsl`
- Authentication: None
- Update Frequency: 15 seconds
- Data Points: 1000-2000 active vehicles

**Implementation Details:**

```typescript
// Client: Fetches HSL vehicle positions
fetchHSLVehiclePositions(): Promise<TransitVehiclePosition[]>

// Transform: Converts to NormalizedEvent
transformTransitVehicle(vehicle: TransitVehiclePosition): NormalizedEvent
```

**Categories:** New categories added:
- `transit` - Joukkoliikenne (buses, trams, metros)

**Vehicle Type Mapping:**
- Route starts with "1" → Tram (Ratikka)
- Route starts with "2" → Metro
- Route starts with "3" → Train (Juna)
- Otherwise → Bus (Bussi)

**API Response:** `/api/transit`
- Returns: GeoJSON FeatureCollection with vehicle positions
- Cache: 15 seconds (TTL: 15s)
- Performance Note: Clustering recommended for 1000+ markers

### 3. Digitraffic Road Weather

**File:** `lib/data/road-weather/`

**API:** Digitraffic REST
- Endpoint: `https://tie.digitraffic.fi/api/weather/v1/stations/data`
- Authentication: None
- Update Frequency: 5 minutes
- Data Points: ~500 road weather stations

**Implementation Details:**

```typescript
// Client: Fetches road weather stations
fetchRoadWeatherStations(): Promise<RoadWeatherStation[]>

// Transform: Converts to NormalizedEvent
transformRoadWeatherStation(station: RoadWeatherStation): NormalizedEvent
```

**Category:** New category added:
- `road_weather` - Tiesää (🌡️)

**Severity Logic:**
- High: Ice/snow, poor visibility (<200m), strong wind (>15 m/s)
- Medium: Slippery, limited visibility (<500m), wind (>10 m/s)
- Low: Normal conditions

**API Response:** `/api/road-weather`
- Returns: GeoJSON FeatureCollection with station data
- Cache: 5 minutes (TTL: 300s)

## Filter System Updates

The `UnifiedFilterContext` now includes:

```typescript
interface UnifiedFilterState {
  // ... existing crime & traffic ...

  weather: {
    layerVisible: boolean;
    metric: 'temperature' | 'wind' | 'precipitation';
  };

  transit: {
    layerVisible: boolean;
    vehicleTypes: ('bus' | 'tram' | 'metro' | 'train')[];
  };

  roadWeather: {
    layerVisible: boolean;
  };
}
```

**Available Actions:**
- `setWeatherLayerVisible(visible: boolean)`
- `setWeatherMetric(metric: 'temperature' | 'wind' | 'precipitation')`
- `setTransitLayerVisible(visible: boolean)`
- `setTransitVehicleTypes(types: ('bus'|'tram'|'metro'|'train')[])`
- `toggleTransitVehicleType(type)`
- `setRoadWeatherLayerVisible(visible: boolean)`

## Integration Checklist

### Backend Setup
- [x] Create data clients (FMI, HSL, Digitraffic)
- [x] Create transform modules (NormalizedEvent conversion)
- [x] Create API endpoints
- [x] Add cache headers for performance
- [x] Add new event categories to constants
- [x] Update polling intervals

### Filter & State Management
- [x] Extend UnifiedFilterContext with new state
- [x] Add new actions for each data source
- [x] Update DEFAULT_STATE

### Frontend (Next Steps)
- [ ] Create WeatherLayer component
- [ ] Create TransitLayer component
- [ ] Create RoadWeatherLayer component
- [ ] Update FilterPanel UI
- [ ] Update Legend component
- [ ] Add layer toggling to MapContainer

### Dependencies
- [x] Added `xml2js` for FMI WFS parsing

## Performance Considerations

### Data Volume
- **Weather:** ~5000 points (low payload, sparse)
- **Transit:** 1000-2000 points (high frequency updates)
- **Road Weather:** ~500 points (low frequency)

### Optimization Strategies

1. **HSL Transit (Marker Clustering)**
   ```typescript
   // Mapbox cluster configuration
   {
     cluster: true,
     clusterMaxZoom: 14,
     clusterRadius: 50,
   }
   ```

2. **GeoJSON Size**
   - FMI: ~2MB (estimate)
   - HSL: ~3MB peak hours (estimate)
   - Road Weather: ~0.5MB (estimate)

3. **Polling Strategy**
   - Weather: 5 min (300s)
   - Transit: 15 sec (15s) - use useEffect with setInterval
   - Road Weather: 5 min (300s)

### Caching Headers

```
Weather: Cache-Control: public, max-age=300, stale-while-revalidate=600
Transit: Cache-Control: public, max-age=15, stale-while-revalidate=30
Road Weather: Cache-Control: public, max-age=300, stale-while-revalidate=600
```

## Testing Checklist

### Data Validation
- [ ] FMI weather coordinates within Finland bounds (19-32°E, 59-71°N)
- [ ] HSL vehicle positions are valid (within bounds, moving)
- [ ] Road weather stations have valid coordinates
- [ ] Temperature ranges are realistic (-40°C to +40°C)
- [ ] Wind speeds are reasonable (0-30 m/s)

### API Endpoints
- [ ] GET /api/weather returns valid GeoJSON
- [ ] GET /api/transit returns valid GeoJSON
- [ ] GET /api/road-weather returns valid GeoJSON
- [ ] All endpoints return 500+ features within 2 seconds
- [ ] Cache headers are present

### Browser Testing
- [ ] Weather layer renders without lag
- [ ] Transit layer renders with 1000+ markers
- [ ] Road weather layer renders without issues
- [ ] Layer toggling works smoothly
- [ ] Filter changes update layer visibility

## Known Issues & Limitations

### FMI Weather
- **XML Parsing:** Response is GML/XML - requires xml2js
- **Historical Data:** Only returns last hour of observations
- **Coverage:** Limited to Finland (~5000 stations)

### HSL Transit
- **Coverage:** PääkaupunkiseutuJa only (Helsinki region)
- **Data Volume:** 1000-2000 vehicles during peak → performance optimization needed
- **JSON API:** Unofficial endpoint (may change) - Protocol Buffers alternative available

### Digitraffic Road Weather
- **Coverage:** ~500 stations on major roads only
- **Update Frequency:** 1 minute (not real-time)

## Next Steps (Phase 2)

After Phase 1 MVP validation:

1. Create map layer components
   - `components/map/layers/WeatherLayer.tsx`
   - `components/map/layers/TransitLayer.tsx`
   - `components/map/layers/RoadWeatherLayer.tsx`

2. Update UI components
   - `components/ui/FilterPanel.tsx` - Add filter controls
   - `components/ui/Legend.tsx` - Add legend entries

3. Add to MapContainer
   - Render layers conditionally based on filter state
   - Add polling mechanisms

4. Performance optimization
   - Implement marker clustering for transit
   - Add client-side GeoJSON filtering

## Resource Links

### APIs
- [FMI Open Data Manual](https://en.ilmatieteenlaitos.fi/open-data-manual)
- [HSL GTFS-RT Docs](https://hsldevcom.github.io/gtfs_rt/)
- [Digitraffic Road Weather](https://www.digitraffic.fi/en/road-traffic/)

### Libraries
- [xml2js](https://www.npmjs.com/package/xml2js) - XML parsing
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) - Map visualization
- [GeoJSON Spec](https://geojson.org/)

## Deployment Notes

### Environment Variables
No new environment variables required (all APIs are public/open data).

### Build Requirements
```bash
npm install  # Installs xml2js for FMI parsing
npm run build
npm run start
```

### Cache Invalidation
All endpoints use HTTP Cache headers - no manual cache clearing needed.

---

**Implementation Status:** ✅ Phase 1 Complete
**Frontend Status:** ⏳ Pending (Layer components needed)
**Testing Status:** 🔄 In Progress
