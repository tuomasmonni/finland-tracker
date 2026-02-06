/**
 * Tilannetieto.fi - Weather Camera Transform
 * Muuntaa Digitraffic API-vastauksen sovelluksen muotoon
 */

import type {
  WeatherCameraApiStation,
  WeatherCameraStation,
  WeatherCameraFeatureCollection,
  WeatherCameraFeature,
} from './types';

const IMAGE_BASE_URL = 'https://weathercam.digitraffic.fi';

/**
 * Muuntaa yksittäisen aseman API-vastauksesta sovelluksen muotoon
 * Suodattaa vain aktiivisia preset-kuvia (inCollection === true)
 */
export function transformWeatherCameraStation(
  station: WeatherCameraApiStation
): WeatherCameraStation | null {
  // Suodata vain aktiiviset presetit
  const activePresets = station.properties.presets.filter((p) => p.inCollection);

  if (activePresets.length === 0) {
    return null; // Ohita asemia, joissa ei ole kuvia
  }

  return {
    id: station.properties.id,
    name: station.properties.name,
    coordinates: [
      station.geometry.coordinates[0],
      station.geometry.coordinates[1],
    ],
    presets: activePresets.map((p, idx) => ({
      presetId: p.id,
      imageUrl: `${IMAGE_BASE_URL}/${p.id}.jpg`,
      presetNumber: idx + 1,
    })),
    status:
      station.properties.collectionStatus === 'GATHERING' ? 'active' : 'inactive',
    lastUpdate: station.properties.dataUpdatedTime,
  };
}

/**
 * Muuntaa asemia GeoJSON FeatureCollectioniksi kartalle
 */
export function transformStationsToGeoJSON(
  stations: WeatherCameraStation[]
): WeatherCameraFeatureCollection {
  const features: WeatherCameraFeature[] = stations.map((station) => ({
    type: 'Feature' as const,
    id: station.id,
    geometry: {
      type: 'Point' as const,
      coordinates: station.coordinates,
    },
    properties: {
      stationId: station.id,
      name: station.name,
      presetCount: station.presets.length,
      status: station.status,
    },
  }));

  return {
    type: 'FeatureCollection',
    features,
  };
}
