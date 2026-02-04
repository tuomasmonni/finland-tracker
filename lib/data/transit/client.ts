/**
 * HSL GTFS-RT Transit Client
 *
 * Hakee joukkoliikenteen ajoneuvojen reaaliaikaiset sijainnit
 * HSL:n GTFS-Realtime API:sta (Protocol Buffers -muoto)
 *
 * Vaatii: Ei API-avainta!
 * Päivitystiheys: Sekuntitason (tyypillisesti 15-30 sekuntia)
 */

export interface TransitVehiclePosition {
  vehicleId: string;
  tripId: string;
  routeId: string;
  coordinates: [number, number];
  bearing?: number;
  speed?: number;
  timestamp: Date;
  vehicleType: 'bus' | 'tram' | 'metro' | 'train';
}

/**
 * Hae ajoneuvojen sijainnit HSL GTFS-RT API:sta
 *
 * Huomio: GTFS-Realtime käyttää Protocol Buffers -muotoa.
 * Tämä implementaatio käyttää JSON-vaihtoehtoista API:a jos saatavilla,
 * muutoin voidaan käyttää gtfs-realtime-bindings-kirjastoa.
 *
 * HSL:n JSON API (epävirallinen, saatavilla):
 * https://realtime.hsl.fi/realtime/vehicle-positions/v2/hsl
 */
export async function fetchHSLVehiclePositions(): Promise<TransitVehiclePosition[]> {
  try {
    // HSL tarjoaa myös JSON-API:ta (epävirallinen)
    // Jos se ei ole saatavilla, voidaan käyttää GTFS-RT Protocol Buffers
    const url = 'https://realtime.hsl.fi/realtime/vehicle-positions/v2/hsl';

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HSL API error: ${response.status}`);
    }

    const data = await response.json();
    return parseHSLVehiclePositions(data);
  } catch (error) {
    console.error('HSL vehicle positions fetch failed:', error);
    return [];
  }
}

/**
 * Jäsennä HSL vehicle positions -vastaus
 *
 * Odotettu rakenne (epävirallinen JSON-API):
 * {
 *   entities: [
 *     {
 *       id: "...",
 *       vehicle: {
 *         position: { latitude, longitude, bearing, speed },
 *         vehicle: { id, label },
 *         trip: { tripId, routeId }
 *       }
 *     }
 *   ]
 * }
 */
function parseHSLVehiclePositions(data: any): TransitVehiclePosition[] {
  const positions: TransitVehiclePosition[] = [];

  try {
    const entities = data.entity || [];

    for (const entity of entities) {
      const vehicle = entity.vehicle;
      if (!vehicle) continue;

      const position = vehicle.position;
      if (!position || position.latitude === undefined || position.longitude === undefined) {
        continue;
      }

      const trip = vehicle.trip;
      const vehicleInfo = vehicle.vehicle;

      // Määritä ajoneuvotyyppi reitinumerosta (heuristic)
      let vehicleType: 'bus' | 'tram' | 'metro' | 'train' = 'bus';
      if (trip?.routeId) {
        const routeId = String(trip.routeId);
        if (routeId.startsWith('1')) vehicleType = 'tram';
        else if (routeId.startsWith('2')) vehicleType = 'metro';
        else if (routeId.startsWith('3')) vehicleType = 'train';
      }

      positions.push({
        vehicleId: vehicleInfo?.id || entity.id || '',
        tripId: trip?.tripId || '',
        routeId: trip?.routeId || '',
        coordinates: [position.longitude, position.latitude],
        bearing: position.bearing,
        speed: position.speed,
        timestamp: new Date(),
        vehicleType,
      });
    }

    return positions;
  } catch (error) {
    console.error('Failed to parse HSL vehicle positions:', error);
    return [];
  }
}

/**
 * Vaihtoehtoinen GTFS-RT Protocol Buffer -jäsennin
 * (vaatii: npm install gtfs-realtime-bindings)
 *
 * Käytä tätä jos JSON-API ei ole saatavilla
 */
export async function fetchHSLVehiclePositionsPB(): Promise<TransitVehiclePosition[]> {
  try {
    // Tämä vaatii Protocol Buffer -kirjaston
    // import * as GtfsRealtimeBindings from 'gtfs-realtime-bindings';
    // Toteuttamatta, koska JSON-versio on yksinkertaisempi

    console.warn('Protocol Buffer version not implemented, use JSON API instead');
    return [];
  } catch (error) {
    console.error('HSL GTFS-RT PB fetch failed:', error);
    return [];
  }
}
