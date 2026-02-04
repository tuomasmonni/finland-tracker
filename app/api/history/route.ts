import { NextRequest, NextResponse } from 'next/server';
import { getHistoryEvents, getHistoryStats } from '@/lib/data/traffic/history';
import type { EventFeatureCollection } from '@/lib/types';

/**
 * GET /api/history
 *
 * Palauttaa tapahtumahistorian GeoJSON-muodossa
 *
 * Query parametrit:
 * - hours: Montako tuntia taaksepäin (oletus: 24)
 * - includeInactive: Näytä myös päättyneet tapahtumat (oletus: true)
 * - stats: Palauta vain tilastot (oletus: false)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const hours = parseInt(searchParams.get('hours') || '24', 10);
    const includeInactive = searchParams.get('includeInactive') !== 'false';
    const statsOnly = searchParams.get('stats') === 'true';

    // Palauta vain tilastot jos pyydetty
    if (statsOnly) {
      const stats = await getHistoryStats();
      return NextResponse.json(stats);
    }

    // Laske aikaväli
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

    // Hae tapahtumat
    const events = await getHistoryEvents({
      startTime,
      endTime,
      includeInactive,
    });

    // Muunna GeoJSON FeatureCollectioniksi
    // Huom: timestamp voi olla Date tai string (JSON-serialisaation jälkeen)
    const toISOString = (date: Date | string | undefined): string | undefined => {
      if (!date) return undefined;
      if (typeof date === 'string') return date;
      return date.toISOString();
    };

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
          road: event.location.road,
          timestamp: toISOString(event.timestamp) || new Date().toISOString(),
          endTime: toISOString(event.endTime),
          severity: event.severity,
          source: event.source,
          metadata: event.metadata ? JSON.stringify(event.metadata) : undefined,
        },
      })),
    };

    return NextResponse.json(geojson, {
      headers: {
        'Cache-Control': 'public, max-age=30',
      },
    });
  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history', details: String(error) },
      { status: 500 }
    );
  }
}
