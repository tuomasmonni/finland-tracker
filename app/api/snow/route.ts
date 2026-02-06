/**
 * Tilannetieto.fi - Snow API Route
 * FMI lumensyvyys -> EventFeatureCollection
 */

import { NextResponse } from 'next/server';
import { fetchFmiSnowData } from '@/lib/data/snow/client';
import { transformSnowToEventFeatures } from '@/lib/data/snow/transform';
import { getOrFetch } from '@/lib/cache/redis';

export const dynamic = 'force-dynamic'; // Ei prerenderöidä buildissa

export async function GET() {
  try {
    const featureCollection = await getOrFetch(
      'snow:stations',
      async () => {
        const observations = await fetchFmiSnowData();
        return transformSnowToEventFeatures(observations);
      },
      240 // 4min TTL (polling 5min)
    );

    console.log(`Snow API: ${featureCollection.features?.length ?? 0} stations`);

    return NextResponse.json(featureCollection, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Snow API error:', error);
    return NextResponse.json(
      { type: 'FeatureCollection', features: [] },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, max-age=60' },
      }
    );
  }
}
