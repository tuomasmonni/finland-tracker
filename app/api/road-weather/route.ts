/**
 * Tilannekuva.online - Road Weather API Route
 * Digitraffic tiesääasemat → EventFeatureCollection
 */

import { NextResponse } from 'next/server';
import { fetchRoadWeatherData } from '@/lib/data/road-weather/client';
import { transformRoadWeatherToEventFeatures } from '@/lib/data/road-weather/transform';
import { getOrFetch } from '@/lib/cache/redis';

export const revalidate = 300; // ISR: 5 min cache

export async function GET() {
  try {
    const featureCollection = await getOrFetch(
      'road-weather:stations',
      async () => {
        const stationData = await fetchRoadWeatherData();
        return transformRoadWeatherToEventFeatures(stationData);
      },
      240 // 4min TTL (polling 5min)
    );

    console.log(`Road Weather API: ${featureCollection.features.length} stations`);

    return NextResponse.json(featureCollection, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Road Weather API error:', error);
    return NextResponse.json(
      { type: 'FeatureCollection', features: [] },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, max-age=60' },
      }
    );
  }
}
