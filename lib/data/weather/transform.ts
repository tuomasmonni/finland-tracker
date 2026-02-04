/**
 * FMI Weather Data Transformations
 *
 * Muuntaa FMI sääobservationeita NormalizedEvent-muotoon
 */

import type { NormalizedEvent } from '@/lib/types';
import type { FMIWeatherObservation } from './client';

/**
 * Määritä sään vakavuus
 */
function determineWeatherSeverity(obs: FMIWeatherObservation): 'low' | 'medium' | 'high' {
  // Korkea: pakkanen tai kuuma, kova tuuli, sataa paljon
  if (
    (obs.temperature !== undefined && obs.temperature < -15) ||
    (obs.temperature !== undefined && obs.temperature > 30) ||
    (obs.windSpeed !== undefined && obs.windSpeed > 10) ||
    (obs.precipitation !== undefined && obs.precipitation > 5)
  ) {
    return 'high';
  }

  // Keskitaso: lievästi pakkasen puolella, tuulista, sataa jonkin verran
  if (
    (obs.temperature !== undefined && obs.temperature < 0) ||
    (obs.windSpeed !== undefined && obs.windSpeed > 5) ||
    (obs.precipitation !== undefined && obs.precipitation > 0)
  ) {
    return 'medium';
  }

  return 'low';
}

/**
 * Muunna FMI havainto normalisoiduksi tapahtumaksi
 */
export function transformWeatherObservation(obs: FMIWeatherObservation): NormalizedEvent {
  const parts: string[] = [];

  if (obs.temperature !== undefined) {
    parts.push(`Lämpötila ${obs.temperature.toFixed(1)}°C`);
  }
  if (obs.windSpeed !== undefined) {
    parts.push(`Tuuli ${obs.windSpeed.toFixed(1)} m/s`);
  }
  if (obs.humidity !== undefined) {
    parts.push(`Kosteus ${obs.humidity.toFixed(0)}%`);
  }
  if (obs.precipitation !== undefined && obs.precipitation > 0) {
    parts.push(`Sadetta ${obs.precipitation.toFixed(1)} mm`);
  }

  const description = parts.join(', ');

  return {
    id: `weather-${obs.stationId}-${obs.timestamp.getTime()}`,
    type: 'weather',
    category: 'weather',
    title: `Sää: ${obs.stationName}`,
    description: description || 'Sään havainto',
    location: {
      coordinates: obs.coordinates,
      name: obs.stationName,
    },
    timestamp: obs.timestamp,
    severity: determineWeatherSeverity(obs),
    source: 'Ilmatieteenlaitos',
    metadata: {
      temperature: obs.temperature,
      windSpeed: obs.windSpeed,
      humidity: obs.humidity,
      precipitation: obs.precipitation,
      pressure: obs.pressure,
      stationId: obs.stationId,
    },
  };
}

/**
 * Muunna kaikki havainnot
 */
export function transformAllWeatherObservations(
  observations: FMIWeatherObservation[]
): NormalizedEvent[] {
  return observations
    .map(transformWeatherObservation)
    .filter(event => {
      // Suodata pois Suomen ulkopuoliset
      const [lng, lat] = event.location.coordinates;
      return lng >= 19 && lng <= 32 && lat >= 59 && lat <= 71;
    });
}
