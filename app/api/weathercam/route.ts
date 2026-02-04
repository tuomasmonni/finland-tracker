/**
 * Tilannekuva.online - Weather Camera API Route
 * Next.js API endpoint joka välimuistiin kelikamerat 5 minuutiksi
 */

import { NextResponse } from 'next/server';
import { fetchWeatherCameras } from '@/lib/data/weathercam/client';
import { transformWeatherCameraStation } from '@/lib/data/weathercam/transform';
import type { WeatherCameraStation } from '@/lib/data/weathercam/types';

export const revalidate = 300; // ISR: 5 min cache

export async function GET() {
  try {
    const apiResponse = await fetchWeatherCameras();

    if (!apiResponse.features || apiResponse.features.length === 0) {
      console.warn('No weather camera features received from API');
      return NextResponse.json([], { status: 200 });
    }

    // Transformoi ja suodata asemia
    const stations: WeatherCameraStation[] = apiResponse.features
      .map(transformWeatherCameraStation)
      .filter((station): station is WeatherCameraStation => station !== null);

    console.log(
      `Processed ${stations.length} weather camera stations from ${apiResponse.features.length} total`
    );

    return NextResponse.json(stations, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Weather camera API error:', error);
    // Älä kaada - palauta tyhjä array
    return NextResponse.json([], {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60',
      },
    });
  }
}
