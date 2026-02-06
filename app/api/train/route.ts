/**
 * Tilannetieto.fi - Train API Route
 * Junaseuranta -> EventFeatureCollection
 */

import { NextResponse } from 'next/server';
import { fetchTrainData } from '@/lib/data/train/client';
import { transformTrainToEventFeatures } from '@/lib/data/train/transform';

export const dynamic = 'force-dynamic'; // Ei prerenderöidä buildissa

export async function GET() {
  try {
    const trains = await fetchTrainData();
    const featureCollection = transformTrainToEventFeatures(trains);

    console.log(`Train API: ${featureCollection.features?.length ?? 0} trains`);

    return NextResponse.json(featureCollection, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Train API error:', error);
    return NextResponse.json(
      { type: 'FeatureCollection', features: [] },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, max-age=5' },
      }
    );
  }
}
