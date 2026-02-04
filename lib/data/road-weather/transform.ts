/**
 * Digitraffic Road Weather Data Transformations
 *
 * Muuntaa tiesääasema-data NormalizedEvent-muotoon
 */

import type { NormalizedEvent } from '@/lib/types';
import type { RoadWeatherStation } from './client';

/**
 * Määritä tiesään vakavuus
 */
function determineRoadWeatherSeverity(station: RoadWeatherStation): 'low' | 'medium' | 'high' {
  const temp = station.weather?.airTemperature;
  const condition = station.weather?.roadCondition?.toLowerCase() || '';
  const visibility = station.weather?.visibility;
  const wind = station.weather?.windSpeed;

  // Korkea: Jäätävä sade, heikko näkyvyys, kova tuuli
  if (
    condition.includes('jää') ||
    condition.includes('lumisade') ||
    (visibility !== undefined && visibility < 200) ||
    (wind !== undefined && wind > 15)
  ) {
    return 'high';
  }

  // Keskitaso: Keli liukas, näkyvyys heikko, tuuli
  if (
    condition.includes('liukast') ||
    (visibility !== undefined && visibility < 500) ||
    (wind !== undefined && wind > 10) ||
    (temp !== undefined && (temp < -10 || temp > 25))
  ) {
    return 'medium';
  }

  return 'low';
}

/**
 * Muunna tiesääasema normalisoiduksi tapahtumaksi
 */
export function transformRoadWeatherStation(station: RoadWeatherStation): NormalizedEvent {
  const parts: string[] = [];

  if (station.weather?.airTemperature !== undefined) {
    parts.push(`Ilma ${station.weather.airTemperature.toFixed(1)}°C`);
  }
  if (station.weather?.surfaceTemperature !== undefined) {
    parts.push(`Pinta ${station.weather.surfaceTemperature.toFixed(1)}°C`);
  }
  if (station.weather?.roadCondition) {
    parts.push(`Keli: ${station.weather.roadCondition}`);
  }
  if (station.weather?.visibility !== undefined) {
    parts.push(`Näkyvyys ${station.weather.visibility} m`);
  }

  const description = parts.join(', ') || 'Tiesää-asema';

  return {
    id: `road-weather-${station.id}-${station.timestamp.getTime()}`,
    type: 'road_weather',
    category: 'road_weather',
    title: `Tiesää: ${station.name}`,
    description,
    location: {
      coordinates: station.coordinates,
      name: station.name,
      road: station.roadNumber?.toString(),
    },
    timestamp: station.timestamp,
    severity: determineRoadWeatherSeverity(station),
    source: 'Digitraffic',
    metadata: {
      stationId: station.id,
      airTemperature: station.weather?.airTemperature,
      surfaceTemperature: station.weather?.surfaceTemperature,
      roadCondition: station.weather?.roadCondition,
      visibility: station.weather?.visibility,
      windSpeed: station.weather?.windSpeed,
    },
  };
}

/**
 * Muunna kaikki asemapisteet
 */
export function transformAllRoadWeatherStations(
  stations: RoadWeatherStation[]
): NormalizedEvent[] {
  return stations
    .map(transformRoadWeatherStation)
    .filter(event => {
      // Suodata pois Suomen ulkopuoliset
      const [lng, lat] = event.location.coordinates;
      return lng >= 19 && lng <= 32 && lat >= 59 && lat <= 71;
    });
}
