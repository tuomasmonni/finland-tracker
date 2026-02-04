/**
 * FMI Weather Data Client
 *
 * Hakee säädata Ilmatieteenlaitoksen avoimen datan WFS API:sta
 * Stored Query: fmi::observations::weather::timevaluepair
 *
 * Vaatii: Ei API-avainta!
 */

import { parseStringPromise } from 'xml2js';

export interface FMIWeatherObservation {
  stationName: string;
  stationId: string;
  coordinates: [number, number];
  timestamp: Date;
  temperature?: number;      // Celsius
  windSpeed?: number;        // m/s
  precipitation?: number;    // mm
  humidity?: number;          // %
  pressure?: number;         // hPa
}

/**
 * Hae säädata FMI WFS API:sta
 *
 * Parametrit:
 * - temperature (t)
 * - wind speed (ws_10min)
 * - precipitation (r_1h)
 * - relative humidity (rh)
 * - air pressure (p)
 */
export async function fetchFMIWeather(): Promise<FMIWeatherObservation[]> {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const startTime = oneHourAgo.toISOString();
    const endTime = now.toISOString();

    // FMI Open Data WFS endpoint
    const url = new URL('https://opendata.fmi.fi/wfs');
    url.searchParams.append('service', 'WFS');
    url.searchParams.append('version', '2.0.0');
    url.searchParams.append('request', 'GetFeature');
    url.searchParams.append('storedquery_id', 'fmi::observations::weather::timevaluepair');
    url.searchParams.append('starttime', startTime);
    url.searchParams.append('endtime', endTime);
    url.searchParams.append('parameters', 't,ws_10min,r_1h,rh,p');
    url.searchParams.append('timestep', '60');
    url.searchParams.append('crs', 'EPSG::4326');

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/gml+xml',
      },
    });

    if (!response.ok) {
      throw new Error(`FMI API error: ${response.status}`);
    }

    const xmlText = await response.text();
    const parsed = await parseStringPromise(xmlText);

    return parseFMIWeatherResponse(parsed);
  } catch (error) {
    console.error('FMI weather fetch failed:', error);
    return [];
  }
}

/**
 * Jäsennä FMI GML/XML vastaus sääobservationeiksi
 */
function parseFMIWeatherResponse(gmlData: any): FMIWeatherObservation[] {
  const observations: FMIWeatherObservation[] = [];

  try {
    // GML structure: wfs:FeatureCollection > wfs:member > BsWfs:BsWfsElement
    const members = gmlData['wfs:FeatureCollection']['wfs:member'] || [];
    const memberArray = Array.isArray(members) ? members : [members];

    for (const member of memberArray) {
      const element = member['BsWfs:BsWfsElement']?.[0];
      if (!element) continue;

      const stationName = element['BsWfs:stationName']?.[0] || '';
      const stationId = element['BsWfs:fmisid']?.[0] || '';

      // Coordinates
      const posText = element['BsWfs:Position']?.[0]?.['gml:pos']?.[0] || '';
      const [latStr, lonStr] = posText.split(' ');
      const coordinates: [number, number] = [parseFloat(lonStr), parseFloat(latStr)];

      // Measurements - typically in a table format
      const measurements = element['BsWfs:measurements']?.[0] || {};
      const timeInstants = measurements['BsWfs:MeasurementTimeValuePair'] || [];
      const timeArray = Array.isArray(timeInstants) ? timeInstants : [timeInstants];

      for (const timeValue of timeArray) {
        const timestamp = new Date(timeValue['BsWfs:time']?.[0] || new Date());

        // Parse values - they come in pairs
        const values = timeValue['BsWfs:value'] || [];
        const valueArray = Array.isArray(values) ? values : [values];

        const observation: FMIWeatherObservation = {
          stationName,
          stationId,
          coordinates,
          timestamp,
        };

        // Parse individual values (this is simplified - actual structure may vary)
        for (let i = 0; i < valueArray.length; i++) {
          const value = parseFloat(valueArray[i]);
          if (isNaN(value)) continue;

          // Map based on parameter order (t, ws_10min, r_1h, rh, p)
          switch (i) {
            case 0: observation.temperature = value; break;
            case 1: observation.windSpeed = value; break;
            case 2: observation.precipitation = value; break;
            case 3: observation.humidity = value; break;
            case 4: observation.pressure = value; break;
          }
        }

        observations.push(observation);
      }
    }

    return observations;
  } catch (error) {
    console.error('Failed to parse FMI weather response:', error);
    return [];
  }
}
