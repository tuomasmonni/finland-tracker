/**
 * Tilannekuva.online - Kelikamerat Types
 * Digitraffic API yhteensopivat tyypit
 */

// ============================================
// API RESPONSE TYPES (Digitraffic)
// ============================================

export interface WeatherCameraApiStation {
  id: string;
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number, number]; // [lng, lat, elevation]
  };
  properties: {
    id: string;
    name: string;
    collectionStatus: 'GATHERING' | 'REMOVED_TEMPORARILY';
    dataUpdatedTime: string;
    presets: WeatherCameraPreset[];
  };
}

export interface WeatherCameraPreset {
  id: string;              // e.g., "C0150301"
  inCollection: boolean;   // Onko kuvia saatavilla
}

export interface WeatherCameraApiResponse {
  type: 'FeatureCollection';
  dataUpdatedTime: string;
  features: WeatherCameraApiStation[];
}

// ============================================
// NORMALIZED DATA TYPES (sovelluksessa)
// ============================================

export interface WeatherCameraStation {
  id: string;
  name: string;
  coordinates: [number, number]; // [lng, lat]
  presets: WeatherCameraImage[];
  status: 'active' | 'inactive';
  lastUpdate: string;
}

export interface WeatherCameraImage {
  presetId: string;
  imageUrl: string;      // https://weathercam.digitraffic.fi/{presetId}.jpg
  presetNumber: number;  // 1-7 (UI-näyttö)
}

// ============================================
// GEOJSON TYPES
// ============================================

export interface WeatherCameraFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    stationId: string;
    name: string;
    presetCount: number;
    status: 'active' | 'inactive';
  };
}

export interface WeatherCameraFeatureCollection {
  type: 'FeatureCollection';
  features: WeatherCameraFeature[];
}

// ============================================
// MODAL PROPS
// ============================================

export interface WeatherCameraModalProps {
  station: WeatherCameraStation | null;
  onClose: () => void;
}
