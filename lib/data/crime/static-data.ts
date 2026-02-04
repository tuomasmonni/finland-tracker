/**
 * Staattinen rikostilastodata
 * Päivitetty: 03.02.2026
 * Lähde: Tilastokeskus
 */

import crimeDataJson from '@/data/static/crime-statistics.json';

export interface StaticCrimeData {
  metadata: {
    source: string;
    url: string;
    fetchedAt: string;
    years: string[];
    categories: string[];
  };
  municipalityNames: Record<string, string>;
  crimeData: Record<string, Record<string, Record<string, number>>>;
}

export const staticCrimeData = crimeDataJson as StaticCrimeData;

/**
 * Hae rikostilastot staattisesta datasta
 */
export function getStaticCrimeStats(
  year: string,
  categories: string[] = ['SSS']
): Array<{ municipalityCode: string; municipalityName: string; totalCrimes: number }> {
  const yearData = staticCrimeData.crimeData[year];
  if (!yearData) {
    console.warn(`Vuosi ${year} ei löydy staattisesta datasta`);
    return [];
  }

  const results: Array<{ municipalityCode: string; municipalityName: string; totalCrimes: number }> = [];

  for (const [munCode, categoryData] of Object.entries(yearData)) {
    let total = 0;

    // Summaa valitut kategoriat
    for (const category of categories) {
      total += categoryData[category] || 0;
    }

    results.push({
      municipalityCode: munCode,
      municipalityName: staticCrimeData.municipalityNames[munCode] || munCode,
      totalCrimes: total,
    });
  }

  return results;
}

/**
 * Hae saatavilla olevat vuodet
 */
export function getAvailableYears(): string[] {
  return staticCrimeData.metadata.years;
}

/**
 * Hae saatavilla olevat kategoriat
 */
export function getAvailableCategories(): string[] {
  return staticCrimeData.metadata.categories;
}
