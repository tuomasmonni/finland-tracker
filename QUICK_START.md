# Tilannekuva.online - Quick Start

## Kehitysympäristö

### 1. Edellytykset
- Node.js 18+ ja npm
- WSL2 / Linux / macOS
- Mapbox-tili (ilmainen)

### 2. Mapbox Token

1. Rekisteröidy: https://account.mapbox.com/
2. Luo Access Token: https://account.mapbox.com/tokens/
3. Kopioi token ja aseta `.env.local`:

```bash
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
```

### 3. Asennus

```bash
cd /mnt/c/Dev/IMPERIUM/2_KONSEPTIT/tilannekuva.online
npm install --legacy-peer-deps
npm run dev
```

Avaa selain: http://localhost:3000

## Rakenne

### Kerrokset (Kartalla)

**Tausta → Etuala:**
1. Mapbox base style (dark-v11 / streets-v12)
2. Crime choropleth (värilliset kunnat)
3. Crime outlines (kunnan rajat)
4. Traffic pulse (animoidut ympyrät)
5. Traffic icons (merkinnät)

### State Management

**UnifiedFilterContext** hallinnoi:
- `crime.year`, `crime.categories`, `crime.layerVisible`
- `traffic.timeRange`, `traffic.categories`, `traffic.layerVisible`
- `theme` (dark / light)

```typescript
// Käyttö komponenteissa:
const { crime, traffic, setCrimeYear, setTrafficTimeRange } = useUnifiedFilters();
```

### API Endpoints

| Endpoint | Kuvaus | Cache |
|----------|--------|-------|
| `GET /api/crime-stats?year=2024` | Rikostilastot GeoJSON | 1h |
| `GET /api/traffic` | Live liikenneilmoitukset | 60s |
| `GET /api/history?hours=24` | Liikenneilmoitusten historia | 30s |

## Tiedostojen kuvaus

### Kriittiset tiedostot

| Tiedosto | Kuvaus |
|----------|--------|
| `lib/contexts/UnifiedFilterContext.tsx` | State management + hooks |
| `components/map/layers/CrimeLayer.tsx` | Rikostilastot choropleth |
| `components/map/layers/TrafficLayer.tsx` | Liikennetapahtumien markerit |
| `lib/data/crime/api.ts` | Crime data fetching + transforming |
| `lib/data/traffic/client.ts` | Fintraffic API client |

### Data-tiedostot

| Tiedosto | Koko | Sisältö |
|----------|------|---------|
| `data/static/crime-statistics.json` | 304 KB | Kunnat × vuodet × kategoriat |
| `lib/data/traffic/history.json` (dynaaminen) | - | Tapahtumahistoria |

## Testaus

### Lokaalit testit

```bash
# Testaa crime API
curl http://localhost:3000/api/crime-stats?year=2024&categories=SSS

# Testaa traffic API
curl http://localhost:3000/api/traffic

# Testaa history
curl http://localhost:3000/api/history?hours=24
```

### UI-testaus

- [ ] Crime-kerros näkyy kartalla
- [ ] Traffic-markerit näkyvät kartalla
- [ ] Vuosi-dropdown muuttaa data:ta
- [ ] Kategoriasuodattimet toimivat
- [ ] Aikasuodatin (2h, 8h, jne.) toimii
- [ ] Theme toggle vaihtaa kartan tyylin
- [ ] Traffic marker klikkaus avaa detail card
- [ ] Crime hover näyttää tooltip
- [ ] Legenda päivittyy suodattimien mukaan

## Vianmääritys

### "Mapbox token not found" virhe

```bash
# Tarkista .env.local
cat .env.local

# Jos tyhjä, aseta:
echo "NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1..." > .env.local

# Käynnistä uudelleen:
npm run dev
```

### Kerrokset eivät näy

1. Tarkista konsoli (F12) virheille
2. Varmista että crime/traffic API:t vastaavat
3. Tarkista että map instance on valmis (MapContainer:n onMapReady callback)

### Performance-ongelmat

1. Crime choropleth on raskasta - debounce on 300ms
2. Traffic polling on 60s välein - voi muuttaa POLLING_INTERVALS:ssa
3. GeoJSON koot: crime ~304KB, traffic ~100KB average

## Seuraavat vaiheet

1. ✅ Perusprojekti valmis
2. ⚠️ Testaus ja debug
3. 📦 Production build & deploy
4. 🚀 Domain setup (tilannekuva.online)
5. 📊 Analytics lisääminen

## Resurssit

- [Mapbox GL JS docs](https://docs.mapbox.com/mapbox-gl-js/)
- [Fintraffic API](https://digitraffic.fi/)
- [Tilastokeskus PxWeb API](https://pxdata.stat.fi/)
- [Next.js docs](https://nextjs.org/docs)

---

**Viimeksi päivitetty:** 04.02.2026
**Versio:** 0.1.0-alpha
