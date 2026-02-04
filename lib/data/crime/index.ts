export {
  fetchCrimeStatsByMunicipality,
  fetchAvailableYears,
  fetchCrimeCategories,
  crimeStatsToGeoJsonProperties,
  fetchMunicipalityBoundaries,
  fetchCrimeMapData,
} from './api';

export type {
  CrimeStatistics,
  MunicipalityGeoJSON,
  CrimeMapGeoJSON,
  CrimeMapFeature,
} from './api';

// Staattinen data
export {
  getStaticCrimeStats,
  getAvailableYears,
  getAvailableCategories,
  staticCrimeData,
} from './static-data';
