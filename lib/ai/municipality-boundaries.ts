/**
 * Municipality Boundaries - WFS fetch utility
 * Extracted from lib/data/crime/api.ts for shared use
 */

const WFS_BASE_URL = 'https://geo.stat.fi/geoserver/tilastointialueet/wfs';

export interface MunicipalityGeoJSON {
  type: 'FeatureCollection';
  features: {
    type: 'Feature';
    geometry: {
      type: 'Polygon' | 'MultiPolygon';
      coordinates: number[][][] | number[][][][];
    };
    properties: {
      kunta: string;
      nimi: string;
      namn: string;
      name: string;
      vuosi: number;
    };
  }[];
}

// In-memory cache for boundaries (they only change yearly)
let cachedBoundaries: MunicipalityGeoJSON | null = null;
let cachedYear: number | null = null;

/**
 * Fetch municipality boundaries from Tilastokeskus WFS service
 * Returns GeoJSON in WGS84 (EPSG:4326)
 */
export async function fetchMunicipalityBoundaries(
  year: number = 2024
): Promise<MunicipalityGeoJSON> {
  if (cachedBoundaries && cachedYear === year) {
    return cachedBoundaries;
  }

  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeName: `tilastointialueet:kunta4500k_${year}`,
    outputFormat: 'application/json',
    srsName: 'EPSG:4326',
  });

  const url = `${WFS_BASE_URL}?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`WFS error: ${response.status}`);
  }

  const geojson: MunicipalityGeoJSON = await response.json();
  cachedBoundaries = geojson;
  cachedYear = year;
  return geojson;
}
