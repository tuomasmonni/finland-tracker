/**
 * Digitraffic Road Weather Data Client
 *
 * Hakee tiesääasemat- ja keligatunnistetiedot Digitraffic API:sta
 * Täydentää olemassa olevaa Fintraffic-integraatiota
 *
 * Vaatii: Ei API-avainta!
 */

export interface RoadWeatherStation {
  id: string;
  name: string;
  coordinates: [number, number];
  roadNumber?: number;
  weather?: {
    airTemperature?: number;
    surfaceTemperature?: number;
    roadCondition?: string;
    visibility?: number;
    windSpeed?: number;
  };
  timestamp: Date;
}

/**
 * Hae tiesääasemat Digitraffic API:sta
 */
export async function fetchRoadWeatherStations(): Promise<RoadWeatherStation[]> {
  try {
    const url = 'https://tie.digitraffic.fi/api/weather/v1/stations/data';

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Digitraffic API error: ${response.status}`);
    }

    const data = await response.json();
    return parseRoadWeatherStations(data);
  } catch (error) {
    console.error('Road weather stations fetch failed:', error);
    return [];
  }
}

/**
 * Jäsennä Digitraffic road weather vastaus
 *
 * Odotettu rakenne:
 * {
 *   weatherStations: [
 *     {
 *       id: "...",
 *       name: "...",
 *       coordinates: { x, y },
 *       roadSegmentId: number,
 *       measurements: [
 *         {
 *           time: "ISO-8601",
 *           airTemperature: number,
 *           roadSurfaceTemperature: number,
 *           measuredTime: "ISO-8601",
 *           ...
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
function parseRoadWeatherStations(data: any): RoadWeatherStation[] {
  const stations: RoadWeatherStation[] = [];

  try {
    const weatherStations = data.weatherStations || [];

    for (const station of weatherStations) {
      if (!station.coordinates) continue;

      const { x: lng, y: lat } = station.coordinates;
      const measurements = station.measurements?.[0];

      stations.push({
        id: station.id || '',
        name: station.name || `Tiesääasema ${station.id}`,
        coordinates: [lng, lat],
        roadNumber: station.roadSegmentId ? Math.floor(station.roadSegmentId / 1000) : undefined,
        weather: {
          airTemperature: measurements?.airTemperature,
          surfaceTemperature: measurements?.roadSurfaceTemperature,
          roadCondition: measurements?.roadCondition,
          visibility: measurements?.visibility,
          windSpeed: measurements?.windSpeed,
        },
        timestamp: measurements?.measuredTime
          ? new Date(measurements.measuredTime)
          : new Date(),
      });
    }

    return stations;
  } catch (error) {
    console.error('Failed to parse road weather stations:', error);
    return [];
  }
}
