import { NextRequest, NextResponse } from 'next/server';
import { fetchCrimeMapData, fetchAvailableYears } from '@/lib/data/crime/api';

/**
 * GET /api/crime-stats
 *
 * Palauttaa rikostilastot yhdistettynä kuntarajoihin GeoJSON-muodossa.
 *
 * Query params:
 * - year: Vuosi (oletus: 2023)
 *
 * Esimerkki: /api/crime-stats?year=2022
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const year = searchParams.get('year') || '2023';

  try {
    const data = await fetchCrimeMapData(year);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Crime stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch crime statistics', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/crime-stats/years
 * Palauttaa saatavilla olevat vuodet
 */
export async function OPTIONS() {
  try {
    const years = await fetchAvailableYears();
    return NextResponse.json({ years });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch available years' },
      { status: 500 }
    );
  }
}
