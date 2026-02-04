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
  populationData?: Record<string, Record<string, number>>;
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

/**
 * Hae väkilukutiedot staattisesta datasta
 *
 * @param year - Vuosi (esim. "2024")
 * @returns Map<kuntakoodi, väkiluku>
 */
export function getStaticPopulationData(year: string): Map<string, number> {
  const populationMap = new Map<string, number>();

  if (!staticCrimeData.populationData) {
    console.warn('Väkilukudata ei ole saatavilla staattisessa datassa');
    return populationMap;
  }

  const yearData = staticCrimeData.populationData[year];
  if (!yearData) {
    console.warn(`Väkilukudata vuodelle ${year} ei löydy staattisesta datasta`);
    return populationMap;
  }

  // Muunna Object -> Map
  for (const [munCode, population] of Object.entries(yearData)) {
    populationMap.set(munCode, population);
  }

  return populationMap;
}
