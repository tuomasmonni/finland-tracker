/**
 * Tilannetieto.fi - Transit API Route
 * HSL joukkoliikenne → EventFeatureCollection
 */

import { NextResponse } from 'next/server';
import { fetchHslVehiclePositions } from '@/lib/data/transit/client';
import { transformTransitToEventFeatures } from '@/lib/data/transit/transform';
import { getOrFetch } from '@/lib/cache/redis';

export const revalidate = 10; // ISR: 10 sec (real-time data)

export async function GET() {
  try {
    const featureCollection = await getOrFetch(
      'transit:vehicles',
      async () => {
        const vehicles = await fetchHslVehiclePositions();
        return transformTransitToEventFeatures(vehicles);
      },
      8 // 8s TTL (polling 15s)
    );

    console.log(`Transit API: ${featureCollection.features.length} vehicles`);

    return NextResponse.json(featureCollection, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Transit API error:', error);
    return NextResponse.json(
      { type: 'FeatureCollection', features: [] },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, max-age=5' },
      }
    );
  }
}
