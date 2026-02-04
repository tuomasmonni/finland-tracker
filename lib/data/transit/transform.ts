/**
 * HSL Transit Data Transformations
 *
 * Muuntaa HSL ajoneuvojen sijainnit NormalizedEvent-muotoon
 */

import type { NormalizedEvent } from '@/lib/types';
import type { TransitVehiclePosition } from './client';

/**
 * Hae ajoneuvotyyppi-emoji
 */
function getVehicleTypeLabel(type: 'bus' | 'tram' | 'metro' | 'train'): string {
  switch (type) {
    case 'tram': return 'Ratikka';
    case 'metro': return 'Metro';
    case 'train': return 'Juna';
    case 'bus':
    default: return 'Bussi';
  }
}

/**
 * Muunna HSL ajoneuvo normalisoiduksi tapahtumaksi
 */
export function transformTransitVehicle(vehicle: TransitVehiclePosition): NormalizedEvent {
  const speedText = vehicle.speed ? `${Math.round(vehicle.speed)} km/h` : 'tuntematon nopeus';
  const description = `Reitti ${vehicle.routeId} - ${speedText}`;

  return {
    id: `transit-${vehicle.vehicleId}-${vehicle.timestamp.getTime()}`,
    type: 'transit',
    category: 'transit',
    title: `${getVehicleTypeLabel(vehicle.vehicleType)} ${vehicle.routeId}`,
    description,
    location: {
      coordinates: vehicle.coordinates,
      name: `${getVehicleTypeLabel(vehicle.vehicleType)} ${vehicle.routeId}`,
    },
    timestamp: vehicle.timestamp,
    severity: 'low',
    source: 'HSL',
    metadata: {
      vehicleId: vehicle.vehicleId,
      routeId: vehicle.routeId,
      tripId: vehicle.tripId,
      vehicleType: vehicle.vehicleType,
      bearing: vehicle.bearing,
      speed: vehicle.speed,
    },
  };
}

/**
 * Muunna kaikki ajoneuvot
 */
export function transformAllTransitVehicles(
  vehicles: TransitVehiclePosition[]
): NormalizedEvent[] {
  return vehicles
    .map(transformTransitVehicle)
    .filter(event => {
      // Suodata pois Suomen ulkopuoliset
      const [lng, lat] = event.location.coordinates;
      return lng >= 19 && lng <= 32 && lat >= 59 && lat <= 71;
    });
}
