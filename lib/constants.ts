/**
 * Tilannekuva.online - Yhdistetyt vakiot
 * Sisältää sekä liikenteen että rikostilastojen konfiguraation
 */

// ============================================
// KARTTA & YLEINEN KONFIGURAATIO
// ============================================

export const FINLAND_BOUNDS: [[number, number], [number, number]] = [
  [19.0, 59.5],  // SW: Ahvenanmaa
  [31.6, 70.1],  // NE: Utsjoki
];

export const MAP_CENTER: [number, number] = [25.5, 64.5];
export const DEFAULT_ZOOM = 5;
export const MIN_ZOOM = 3;
export const MAX_ZOOM = 18;

// Mapbox styles
export const MAP_STYLES = {
  dark: 'mapbox://styles/mapbox/dark-v11',
  light: 'mapbox://styles/mapbox/streets-v12',
} as const;

export type MapTheme = keyof typeof MAP_STYLES;

// ============================================
// LIIKENNE - EVENT KATEGORIAT
// ============================================

export const EVENT_CATEGORIES = {
  accident: {
    color: '#ef4444',
    icon: 'car',
    label: 'Onnettomuus',
    emoji: '🚗',
  },
  disruption: {
    color: '#f97316',
    icon: 'alert-triangle',
    label: 'Häiriö',
    emoji: '⚠️',
  },
  roadwork: {
    color: '#eab308',
    icon: 'construction',
    label: 'Tietyö',
    emoji: '🚧',
  },
  train: {
    color: '#22c55e',
    icon: 'train',
    label: 'Juna',
    emoji: '🚂',
  },
  camera: {
    color: '#3b82f6',
    icon: 'camera',
    label: 'Kelikamera',
    emoji: '📷',
  },
  police: {
    color: '#6366f1',
    icon: 'shield',
    label: 'Poliisi',
    emoji: '🚔',
  },
  fire: {
    color: '#dc2626',
    icon: 'flame',
    label: 'Tulipalo',
    emoji: '🔥',
  },
  weather: {
    color: '#06b6d4',
    icon: 'cloud',
    label: 'Sää',
    emoji: '⛈️',
  },
  transit: {
    color: '#10b981',
    icon: 'bus',
    label: 'Joukkoliikenne',
    emoji: '🚌',
  },
  road_weather: {
    color: '#8b5cf6',
    icon: 'thermometer',
    label: 'Tiesää',
    emoji: '🌡️',
  },
} as const;

export type EventCategory = keyof typeof EVENT_CATEGORIES;

// ============================================
// RIKOSTILASTOT - KATEGORIAT
// ============================================

export const CRIME_CATEGORIES = [
  { code: 'SSS', label: 'Kaikki rikokset', color: '#6b7280' },
  { code: '010000', label: 'Henkirikokset', color: '#dc2626' },
  { code: '020000', label: 'Väkivaltarikokset', color: '#ea580c' },
  { code: '030000', label: 'Seksuaalirikokset', color: '#d946ef' },
  { code: '050000', label: 'Omaisuusrikokset', color: '#2563eb' },
  { code: '060000', label: 'Huumausainerikokset', color: '#65a30d' },
  { code: '070000', label: 'Petokset/korruptio', color: '#ca8a04' },
  { code: '090000', label: 'Turvallisuusrikokset', color: '#78716c' },
] as const;

export type CrimeCategory = typeof CRIME_CATEGORIES[number];

export const AVAILABLE_YEARS = ['2024', '2023', '2022', '2021', '2020'] as const;

// ============================================
// POLLING & API
// ============================================

export const POLLING_INTERVALS = {
  traffic: 60_000,    // 1 min
  trains: 10_000,     // 10 sec
  cameras: 300_000,   // 5 min
  feeds: 300_000,     // 5 min
  weather: 300_000,   // 5 min (FMI)
  transit: 15_000,    // 15 sec (HSL GTFS-RT)
  roadWeather: 300_000, // 5 min (Digitraffic)
} as const;

export const API_ENDPOINTS = {
  trafficMessages: 'https://tie.digitraffic.fi/api/traffic-message/v1/messages',
  weatherCameras: 'https://tie.digitraffic.fi/api/weathercam/v1/stations',
  roadWeather: 'https://tie.digitraffic.fi/api/weather/v1/forecasts',
  trainLocations: 'https://rata.digitraffic.fi/api/v1/train-locations/latest',
  trains: 'https://rata.digitraffic.fi/api/v1/trains',
  yleNews: 'https://feeds.yle.fi/uutiset/v1/recent.rss?publisherIds=YLE_UUTISET&concepts=18-34837',
} as const;

export const SITUATION_TYPES = {
  TRAFFIC_ANNOUNCEMENT: 'Liikenneilmoitus',
  ROAD_WORK: 'Tietyö',
  WEIGHT_RESTRICTION: 'Painorajoitus',
  EXEMPTED_TRANSPORT: 'Erikoiskuljetus',
} as const;
