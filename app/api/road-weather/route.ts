import { NextResponse } from 'next/server';
import { fetchRoadWeatherStations } from '@/lib/data/road-weather/client';
import { transformAllRoadWeatherStations } from '@/lib/data/road-weather/transform';
import type { EventFeatureCollection } from '@/lib/types';

/**
 * GET /api/road-weather
 *
 * Palauttaa Digitraffic tiesääasema-data GeoJSON-muodossa
 */
export async function GET() {
  try {
    const stations = await fetchRoadWeatherStations();

    // Muunna normalisoiduiksi tapahtumiksi
    const events = transformAllRoadWeatherStations(stations);

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
          road: event.location.road,
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
    console.error('Road weather API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch road weather data', details: String(error) },
      { status: 500 }
    );
  }
}
