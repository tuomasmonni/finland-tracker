import { NextResponse } from 'next/server';
import { fetchHSLVehiclePositions } from '@/lib/data/transit/client';
import { transformAllTransitVehicles } from '@/lib/data/transit/transform';
import type { EventFeatureCollection } from '@/lib/types';

/**
 * GET /api/transit
 *
 * Palauttaa HSL joukkoliikenteen ajoneuvojen sijainnit GeoJSON-muodossa
 * Päivitetään 15 sekunnin välein
 */
export async function GET() {
  try {
    const vehicles = await fetchHSLVehiclePositions();

    // Muunna normalisoiduiksi tapahtumiksi
    const events = transformAllTransitVehicles(vehicles);

    // Muunna GeoJSON FeatureCollectioniksi
    const geojson: EventFeatureCollection = {
      type: 'FeatureCollection',
      features: events.map(event => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: event.location.coordinates,
        },
        properties: {
          id: event.id,
          type: event.type,
          category: event.category,
          title: event.title,
          description: event.description,
          locationName: event.location.name,
          timestamp: event.timestamp.toISOString(),
          severity: event.severity,
          source: event.source,
          metadata: event.metadata ? JSON.stringify(event.metadata) : undefined,
        },
      })),
    };

    return NextResponse.json(geojson, {
      headers: {
        'Cache-Control': 'public, max-age=15, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Transit API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transit data', details: String(error) },
      { status: 500 }
    );
  }
}
