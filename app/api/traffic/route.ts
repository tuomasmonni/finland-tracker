/**
 * Tilannekuva.online - Traffic API Route
 * Fintraffic liikenneilmoitukset → EventFeatureCollection
 */

import { NextResponse } from 'next/server';
import { fetchAllTrafficMessages } from '@/lib/data/traffic/client';
import { transformTrafficToEventFeatures } from '@/lib/data/traffic/transform';
import { getOrFetch } from '@/lib/cache/redis';

export const dynamic = 'force-dynamic'; // Ei prerenderöidä buildissa

export async function GET() {
  try {
    const featureCollection = await getOrFetch(
      'traffic:all',
      async () => {
        const rawData = await fetchAllTrafficMessages();
        return transformTrafficToEventFeatures(rawData);
      },
      55 // 55s TTL (polling 60s)
    );

    console.log(`Traffic API: ${featureCollection.features?.length ?? 0} events`);

    return NextResponse.json(featureCollection, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Traffic API error:', error);
    return NextResponse.json(
      { type: 'FeatureCollection', features: [] },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, max-age=30' },
      }
    );
  }
}
