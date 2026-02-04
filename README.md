# Tilannekuva.online

Suomen reaaliaikainen tapahtumakartta - yhdistää rikostilastot ja liikennetiedot yhdelle kartalle.

## Teknologia

- **Next.js 16.1.6** - React-pohjainen full-stack framework
- **React 19** - UI komponentit
- **TypeScript 5** - Tyyppiturva
- **Mapbox GL JS 3.18** - Kartavisualiointi
- **Tailwind CSS 4** - Styling
- **Fintraffic API** - Reaaliaikainen liikennentieto
- **Tilastokeskus** - Rikostilastot

## Rakenne

```
tilannekuva.online/
├── app/                  # Next.js App Router
│   ├── page.tsx         # Pääsivu
│   ├── layout.tsx       # Root layout
│   ├── globals.css      # Global styles
│   └── api/             # API endpoints
│       ├── crime-stats/ # Rikostilastot
│       ├── traffic/     # Liikennetiedot (live)
│       └── history/     # Liikennehistoria
│
├── components/
│   ├── map/
│   │   ├── MapContainer.tsx      # Mapbox-kartta
│   │   └── layers/
│   │       ├── CrimeLayer.tsx    # Rikostilastokerros
│   │       └── TrafficLayer.tsx  # Liikennekerros
│   └── ui/
│       ├── Header.tsx            # Otsikko + theme toggle
│       ├── FilterPanel.tsx       # Suodattimet (yhdistetty)
│       ├── Legend.tsx            # Selite
│       ├── EventDetailCard.tsx   # Tapahtuman yksityiskohdat
│       └── LoadingScreen.tsx     # Latausekraani
│
├── lib/
│   ├── contexts/
│   │   └── UnifiedFilterContext.tsx  # Yhdistetty state management
│   ├── data/
│   │   ├── crime/       # Rikostilastojen data-utilit
│   │   └── traffic/     # Liikennedatan data-utilit
│   ├── constants.ts     # Vakiot (crime + traffic)
│   ├── types.ts         # Tyyppimäärittelyt
│   └── map-icons.ts     # SVG-ikonit kartalle
│
└── data/
    └── static/
        └── crime-statistics.json  # Staattinen rikostilastodata
```

## Asentaminen

```bash
# Kloonaa repo ja mene hakemistoon
cd /mnt/c/Dev/IMPERIUM/2_KONSEPTIT/tilannekuva.online

# Asenna dependencies
npm install

# Luo .env.local ja aseta Mapbox token
echo "NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1..." > .env.local

# Kehityspalvelin
npm run dev

# Avaa selaimessa
# http://localhost:3000
```

## Konfiguraatio

### .env.local

```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1... # Mapbox API token
```

Saat tokenin osoitteesta: https://account.mapbox.com/

## Kerrosrakenne

Kartalla on kaksi päällekkäistä kerrosta:

### 1. Rikostilastot (Choropleth)
- **Tausta**: Kunnan polygonit väreillä
- **Värit**: Quantile-luokittelu (matala→erittäin korkea)
- **Vuodet**: 2020-2024
- **Kategoriat**: 8 rikosluokkaa (henkirikokset, väkivalta, jne.)
- **Hover**: Tooltip kunnan nimellä ja tilastoilla

### 2. Liikenneilmoitukset (Point Markers)
- **Ikonit**: SVG-ikonit kategorioittain (onnettomuus, häiriö, tietyö)
- **Pulse-efekti**: Korkeaprioriteettiset tapahtumat
- **Klikkaus**: Avaa yksityiskohdat
- **Aikasuodatin**: 2h, 8h, 24h, 7pv, all
- **Kategoriat**: Onnettomuus, häiriö, tietyö

## API Endpoints

### GET /api/crime-stats
Palauttaa rikostilastot GeoJSON-muodossa.

Query params:
- `year` (default: 2024) - Vuosi
- `categories` (default: SSS) - Pilkulla erotetut ICCS-koodit

Vastaus: GeoJSON FeatureCollection

### GET /api/traffic
Palauttaa live-liikenneilmoitukset GeoJSON-muodossa.

Vastaus: GeoJSON FeatureCollection

### GET /api/history
Palauttaa liikenneilmoitusten historian aika-suodatuksella.

Query params:
- `hours` (default: 24) - Montako tuntia taaksepäin
- `includeInactive` (default: true) - Näytä myös päättyneet
- `stats` (default: false) - Vain tilastot

## State Management

**UnifiedFilterContext** hallinnoi kaikkea suodatimen tilaa:

```typescript
crime: {
  year: '2024',           // Valittu vuosi
  categories: ['SSS'],    // Valitut rikosluokat
  layerVisible: boolean,  // Näkyykö kerros
  isLoading: boolean      // Ladataanko dataa
}

traffic: {
  timeRange: 'all',       // Aikasuodatin
  categories: [...],      // Valitut tapahtumakategoriat
  layerVisible: boolean   // Näkyykö kerros
}

theme: 'dark'             // dark | light
```

## Lisäominaisuudet

- [ ] URL-parametrit (jakaminen)
- [ ] Aikavertailu (slider useammalle vuodelle)
- [ ] Export karttakuvaksi (PNG/PDF)
- [ ] Analytics (Plausible/Umami)
- [ ] Supabase-integraatio historialle
- [ ] Lisädatalähteet (väestö, taloustilastot)

## Lisensointi

MIT - Vapaasti käytettävissä ja muokattavissa.

## Tekijät

- **IMPERIUM AI** - Sovelluskehitys
- **Tilastokeskus** - Rikostilastot
- **Fintraffic** - Liikenneilmoitukset
- **Mapbox** - Karttainfrastruktuuri

---

**Domain**: tilannekuva.online
**GitHub**: [@tilannehuoneFI](https://x.com/tilannehuoneFI)
**Version**: 0.1.0 (Alpha)
