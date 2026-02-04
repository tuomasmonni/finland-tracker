import { NextResponse } from 'next/server';
import { fetchFMIWeather } from '@/lib/data/weather/client';
import { transformAllWeatherObservations } from '@/lib/data/weather/transform';
import type { EventFeatureCollection } from '@/lib/types';

/**
 * GET /api/weather
 *
 * Palauttaa FMI säädata GeoJSON-muodossa
 */
export async function GET() {
  try {
    const observations = await fetchFMIWeather();

    // Muunna normalisoiduiksi tapahtumiksi
    const events = transformAllWeatherObservations(observations);

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
          municipality: event.location.municipality,
          timestamp: event.timestamp.toISOString(),
          severity: event.severity,
          source: event.source,
          metadata: event.metadata ? JSON.stringify(event.metadata) : undefined,
        },
      })),
    };

    return NextResponse.json(geojson, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data', details: String(error) },
      { status: 500 }
    );
  }
}
