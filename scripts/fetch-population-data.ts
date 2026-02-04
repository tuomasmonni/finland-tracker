/**
 * Skripti väkilukudatan hakemiseen Tilastokeskuksesta
 * Ajettava: npx tsx scripts/fetch-population-data.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fetchPopulationData } from '../lib/data/crime/api';

const DATA_FILE = path.join(__dirname, '../data/static/crime-statistics.json');
const YEARS = ['2020', '2021', '2022', '2023', '2024'];

async function main() {
  console.log('🔄 Haetaan väkilukudata Tilastokeskuksesta...\n');

  // Lue olemassa oleva crime-statistics.json
  const existingData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

  // Luo populationData-rakenne
  const populationData: Record<string, Record<string, number>> = {};

  for (const year of YEARS) {
    console.log(`📊 Haetaan väkiluku vuodelle ${year}...`);
    try {
      const data = await fetchPopulationData(year);

      // Muunna Map -> Object
      const yearData: Record<string, number> = {};
      for (const [code, population] of data) {
        yearData[code] = population;
      }

      populationData[year] = yearData;
      console.log(`✅ Vuosi ${year}: ${data.size} kuntaa\n`);

      // Odota 1s API-kuormituksen välttämiseksi
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Virhe vuodelle ${year}:`, error);
    }
  }

  // Yhdistä olemassa olevaan dataan
  const updatedData = {
    ...existingData,
    populationData
  };

  // Kirjoita takaisin tiedostoon
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(updatedData, null, 2),
    'utf-8'
  );

  console.log('\n✅ Väkilukudata päivitetty tiedostoon:', DATA_FILE);

  // Tulosta tilastot
  const totalMunicipalities = Object.keys(populationData['2024'] || {}).length;
  console.log(`\n📊 Yhteenveto:`);
  console.log(`   - Vuodet: ${YEARS.join(', ')}`);
  console.log(`   - Kunnat: ${totalMunicipalities}`);

  // Näytä esimerkkejä
  if (populationData['2024']) {
    const helsinkiPop = populationData['2024']['091'];
    const espooPop = populationData['2024']['049'];
    console.log(`\n📍 Esimerkkejä (2024):`);
    console.log(`   - Helsinki (091): ${helsinkiPop?.toLocaleString('fi-FI')} as.`);
    console.log(`   - Espoo (049): ${espooPop?.toLocaleString('fi-FI')} as.`);
  }
}

main().catch(error => {
  console.error('❌ Skripti epäonnistui:', error);
  process.exit(1);
});
