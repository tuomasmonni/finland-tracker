# Tilannekuva.online - Arkkitehtuuri

**Dokumentaatio:** Agentille roadmap-suunnitelua varten
**Päivitetty:** 2026-02-04
**Status:** MVP + PostgreSQL + Redis integraatio

---

## 1. YLEISKATSAUS

**Tilannekuva.online** on Next.js-sovellus joka aggregoi reaaliaikaista liikennedataa ja rikos­tilastoja Suomesta.

```
┌─────────────────────────────────────────────────────────────┐
│                    KÄYTTÄJÄ SELAIMEN                         │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP/REST
         ┌───────▼────────────┐
         │   NEXT.JS SERVER   │
         │   (Port 3000)      │
         └───────┬────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
 CACHE        DATA         HISTORY
 (Redis)    (Fintraffic, (PostgreSQL)
           OpenWeather, etc)
```

---

## 2. FRONTEND-ARKKITEHTUURI

### 2.1 Sivukaava (`app/page.tsx`)

```
┌─────────────────────────────────────────────────────────────┐
│ Header (Otsikko + Tema)                                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐                                             │
│  │Filter Panel │  ◄── Filtrit (Vasemmalla, desktop)         │
│  │             │                                             │
│  │ • Traffic   │                                             │
│  │ • Crime     │     ┌──────────────────────────────────┐   │
│  │ • Weather   │     │      MAPBOX-KARTTA              │   │
│  │ • Transit   │     │                                  │   │
│  │             │     │  • Traffic Layer                │   │
│  │ Severity    │     │  • Crime Layer                  │   │
│  │ Level       │     │  • Weather Layer                │   │
│  │             │     │  • Transit Layer                │   │
│  └─────────────┘     │  • Camera Layer                 │   │
│                      │                                  │   │
│                      │  Events näytetään niiden        │   │
│                      │  sijainnin perusteella kartalla │   │
│                      └──────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Legend (Bottom) - Tapahtumien värit ja kuvakkeeet    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Komponentit

| Komponentti | Sijainti | Tehtävä |
|---|---|---|
| `Header` | `components/ui/Header.tsx` | Logo, otsikko, teeman vaihto |
| `MapContainer` | `components/map/MapContainer.tsx` | Mapbox-kartan alustus |
| `FilterPanel` | `components/ui/FilterPanel.tsx` | Suodattimet (kategoria, vakavuus) |
| `TrafficLayer` | `components/map/layers/TrafficLayer.tsx` | Liikennetutkittavat (polling 60s) |
| `CrimeLayer` | `components/map/layers/CrimeLayer.tsx` | Rikosjutut (staattinen data) |
| `WeatherCameraLayer` | `components/map/layers/WeatherCameraLayer.tsx` | Tiesää kamerot |
| `EventDetailCard` | `components/ui/EventDetailCard.tsx` | Valitun tapahtuman yksityiskohdat |
| `Legend` | `components/ui/Legend.tsx` | Kategorioiden värit/ikonit |

### 2.3 State Management

**Context API:** `UnifiedFilterContext` (`lib/contexts/UnifiedFilterContext.tsx`)

```typescript
{
  filters: {
    traffic: boolean,
    crime: boolean,
    weather: boolean,
    transit: boolean,
    severity: 'all' | 'low' | 'medium' | 'high'
  },
  theme: 'light' | 'dark'
}
```

**Ongelma (P1):** Jokainen filterin muutos → kaikki layerit re-renderöivät
**Ratkaisu:** Context-splitting (TrafficContext, CrimeContext, jne.)

---

## 3. BACKEND-ARKKITEHTUURI

### 3.1 API-endpointit

| Endpoint | Metodi | TTL | Lähde | Kuvaus |
|---|---|---|---|---|
| `/api/traffic` | GET | 60s | Fintraffic | Liikenneilmoitukset (GeoJSON) |
| `/api/weather` | GET | 300s | OpenWeather | Säädata (lämpö, sade, tuuli) |
| `/api/road-weather` | GET | 300s | Fintraffic | Tiesääennusteet |
| `/api/transit` | GET | 60s | Fintraffic | Joukkoliikennemuutokset |
| `/api/weather-cam` | GET | 300s | Fintraffic | Tiesää kamerankuvat |
| `/api/crime-stats` | GET | 86400s (24h) | Static JSON | Rikosjutut kaupunneittain |
| `/api/history` | GET | - | PostgreSQL | Historiset liikenneilmoitukset |

### 3.2 Data Flow

```
Client (Browser)
    │
    ├─→ GET /api/traffic
    │   ├─→ Redis cache hit? → Return cached (FAST) ✅
    │   └─→ Cache miss:
    │       └─→ fetchAllTrafficMessages() (Fintraffic API)
    │           └─→ transformAllTrafficEvents() (normalize)
    │               └─→ updateHistory() (PostgreSQL)
    │                   └─→ setCached() (Redis 60s TTL)
    │                       └─→ Return GeoJSON
    │
    └─→ User clicks on event
        └─→ EventDetailCard shows details
```

### 3.3 External APIs (Integrations)

| API | Endpoint | Käyttö | Auth |
|---|---|---|---|
| **Fintraffic** | `https://tie.digitraffic.fi` | Traffic, transit, road weather | Public |
| **OpenWeather** | `https://api.openweathermap.org` | Weather forecasts | API Key |
| **Mapbox** | `https://api.mapbox.com` | Map tiles + clustering | API Token |

---

## 4. TIETOKANTA-ARKKITEHTUURI

### 4.1 PostgreSQL (Supabase)

**Taulu: `event_history`**

```sql
CREATE TABLE event_history (
  id TEXT PRIMARY KEY,                    -- Unique event ID
  event_type TEXT NOT NULL,               -- 'traffic', 'roadwork', etc.
  category TEXT NOT NULL,                 -- Kategoriat (accident, roadwork, jne.)
  title TEXT NOT NULL,                    -- Tapahtuman otsikko
  description TEXT,                       -- Pitkä kuvaus
  location_coordinates JSONB NOT NULL,    -- { lat: 60.17, lng: 24.94 }
  location_name TEXT,                     -- Paikannimi (esim. "Tie 563")
  municipality TEXT,                      -- Kunta (esim. "Helsinki")
  road TEXT,                              -- Tienumero
  first_seen TIMESTAMPTZ NOT NULL,        -- Milloin tapahtuma ilmestyi
  last_seen TIMESTAMPTZ NOT NULL,         -- Milloin se päivitettiin viimeksi
  is_active BOOLEAN NOT NULL,             -- Onko tapahtuma vielä aktiivinen?
  severity TEXT,                          -- 'low', 'medium', 'high'
  source TEXT NOT NULL,                   -- Lähde (Fintraffic, etc.)
  metadata JSONB,                         -- Extra data (muissa kentissä)
  created_at TIMESTAMPTZ DEFAULT NOW(),   -- Rivi luotu
  updated_at TIMESTAMPTZ DEFAULT NOW()    -- Rivi päivitetty
);

-- Indeksit (query performance)
CREATE INDEX idx_event_history_is_active ON event_history(is_active);
CREATE INDEX idx_event_history_last_seen ON event_history(last_seen DESC);
CREATE INDEX idx_event_history_category ON event_history(category);
```

### 4.2 Historian logiikka

**`lib/data/traffic/history-postgres.ts`**

```typescript
// updateHistory(events):
// 1. Hae olemassa olevat events (ID-perusteella)
// 2. Lisää uudet events
// 3. Päivitä olemassa olevat (last_seen = now)
// 4. Merkitse puuttuvat ei-aktiivisiksi (is_active = false)
// 5. Siivoa vanhat tapahtumat (>30 päivää, is_active = false)

// Esimerkki: 100 liikenneilmoitusta päivittyy
// - 10 uutta → INSERT
// - 80 päivittynyttä → UPDATE
// - 10 päättynyttä → UPDATE (is_active = false)
// - Vanhemmat kuin 30 päivää → DELETE
```

### 4.3 Redis (Upstash)

**Cache-strategia:**

```
Avain              TTL    Sisältö
─────────────────────────────────────────────────
traffic:all        60s    GET /api/traffic -vastaus (GeoJSON)
weather:all        300s   GET /api/weather -vastaus
weather-cam:all    300s   GET /api/weather-cam -vastaus
road-weather:all   300s   GET /api/road-weather -vastaus
transit:all        60s    GET /api/transit -vastaus
```

**Eviction policy:** `allkeys-lru` (vanhin → poista)

**Vaikutus:**
- Ilman cachea: 100 käyttäjää = 520 req/min = 31K req/tunti
- Redis cachella: 1 req/min = 60 req/tunti
- **Säästö: 99.8% vähemmän kutsuja!**

---

## 5. POLLING-STRATEGIA (CLIENT-SIDE)

### 5.1 Nykytilanne

| Layer | Interval | Requests/min (100 users) |
|---|---|---|
| Traffic | 60s | 100 req/min |
| Weather | 300s | 20 req/min |
| Transit | 60s | 100 req/min |
| Crime | No polling | 0 req/min |
| **Yhteensä** | - | **220 req/min** |

**Ongelma:** Kun 1000 käyttäjää → 2200 req/min → palvelin kaatuu

### 5.2 Tulevaisuus (SSE Real-time)

- Replace polling → Server-Sent Events (SSE)
- Client lataa data kerran, kuuntelee server-pusheja
- **Vaikutus:** 2200 req/min → 100 yhteyttä (99% vähennys)

---

## 6. MAPBOX-KARTTA

### 6.1 Kerrokset (Layers)

```typescript
// Jokainen layer on GeoJSON-source + rendering
map.addSource('traffic', {
  type: 'geojson',
  data: trafficGeoJSON,  // GET /api/traffic
  cluster: true,         // TODO: Implement clustering
  clusterMaxZoom: 14,
  clusterRadius: 50
});

map.addLayer({
  id: 'traffic-clusters',
  type: 'circle',
  source: 'traffic',
  paint: { /* värit */ }
});
```

### 6.2 Klusteröinti (P0 TODO)

**Ongelma:** 1000-2000 liikenneilmoitusta → selain hidastuu
**Ratkaisu:** Mapbox clustering → 50-100 clusteria zoom-tasosta riippuen

---

## 7. DEPLOYMENT & HOSTING

### 7.1 Nykytilanne

- **Frontend:** Vercel (Next.js)
- **Backend:** Vercel (API routes)
- **Database:** Supabase (PostgreSQL)
- **Cache:** Upstash (Redis)
- **CDN:** Vercel Edge Network (included)

### 7.2 Performance

```
Nykytila (MVP):
  • Max concurrent users: 10-20 (file I/O bottleneck)
  • API response time (p95): 500-2000ms
  • Cache hit rate: 40% (Next.js only)

Jälkeen PostgreSQL + Redis:
  • Max concurrent users: 200-300
  • API response time (p95): 50-100ms
  • Cache hit rate: 95%

Jälkeen SSE + Clustering:
  • Max concurrent users: 500-1000
  • Update latency: <1s (real-time)
  • Bandwidth: -75%
```

---

## 8. TIEDOSTORAKENNE

```
tilannekuva.online/
├── app/
│   ├── api/                 # API routes
│   │   ├── traffic/route.ts
│   │   ├── weather/route.ts
│   │   ├── transit/route.ts
│   │   ├── weather-cam/route.ts
│   │   ├── crime-stats/route.ts
│   │   ├── history/route.ts
│   │   └── road-weather/route.ts
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page (Mapbox + Filters)
│
├── components/
│   ├── map/
│   │   ├── MapContainer.tsx
│   │   └── layers/          # Mapbox layers
│   │       ├── TrafficLayer.tsx
│   │       ├── CrimeLayer.tsx
│   │       ├── WeatherCameraLayer.tsx
│   │       └── TransitLayer.tsx
│   └── ui/                  # UI components
│       ├── Header.tsx
│       ├── FilterPanel.tsx
│       ├── Legend.tsx
│       ├── EventDetailCard.tsx
│       └── WeatherCameraModal.tsx
│
├── lib/
│   ├── db/
│   │   └── supabase.ts              # Supabase client
│   ├── cache/
│   │   └── redis.ts                 # Redis client + helpers
│   ├── data/
│   │   ├── traffic/
│   │   │   ├── client.ts            # Fintraffic API client
│   │   │   ├── transform.ts         # Normalize events
│   │   │   ├── history-postgres.ts  # PostgreSQL history
│   │   │   └── history.ts           # [DEPRECATED] JSON
│   │   ├── weather/
│   │   ├── crime/
│   │   ├── road-weather/
│   │   └── transit/
│   ├── contexts/
│   │   └── UnifiedFilterContext.tsx  # Global state
│   ├── constants.ts                 # Constants
│   ├── types.ts                     # TypeScript types
│   └── map-icons.ts                 # Mapbox icons
│
├── public/
│   └── data/
│       └── crime-statistics.json    # Crime data (static)
│
├── .env.local               # Environment variables
├── package.json
├── tsconfig.json
└── ARCHITECTURE.md          # This file
```

---

## 9. KRIITTISET TIEDOSTOT

| Tiedosto | Tehtävä | Status |
|---|---|---|
| `lib/db/supabase.ts` | PostgreSQL-yhteys | ✅ Valmis |
| `lib/cache/redis.ts` | Redis-cache layer | ✅ Valmis |
| `lib/data/traffic/history-postgres.ts` | Historia-logiikka | ✅ Valmis |
| `app/api/traffic/route.ts` | Traffic API + caching | ✅ Valmis |
| `app/page.tsx` | Pääsivu (Mapbox) | ✅ Valmis |
| `components/map/layers/TransitLayer.tsx` | Transit layer | ⏳ TODO (Clustering) |
| `lib/contexts/UnifiedFilterContext.tsx` | Global state | ⏳ TODO (Split contexts) |

---

## 10. ROADMAP (SEURAAVAT VAIHEET)

### Viikko 1 (Nykyinen)
- ✅ PostgreSQL-migraatio (Supabase)
- ✅ Redis-caching layer
- ⏳ Rate limiting middleware
- ⏳ Background job queue

### Viikko 2
- SSE real-time push (poista polling)
- Mapbox clustering (transit layer)
- Context-splitting (render optimization)
- Tab coordination (multi-tab sync)

### Viikko 3-4
- Error tracking (Sentry)
- Monitoring (Axiom, Vercel Analytics)
- Bundle optimization
- Service Worker (offline support)

---

## 11. HUOMIOON OTETTAVAT ASIAT ROADMAP:IA SUUNNITELTAESSA

1. **P0 Bottlenecks (kriittiset)**
   - JSON file I/O → PostgreSQL ✅ FIXED
   - Polling load → SSE → TODO
   - No clustering → Mapbox clustering → TODO
   - No rate limiting → Middleware → TODO

2. **P1 Optimoinnit (tärkeät)**
   - Monolitinen context → Context-splitting → TODO
   - No caching at component level → useMemo/memo → TODO
   - Tab competition → Tab coordinator → TODO

3. **P2 Lisäykset (nice-to-have)**
   - No error tracking → Sentry → TODO
   - No monitoring → Axiom + Vercel Analytics → TODO
   - Large bundle → Image optimization + analyzer → TODO
   - No offline → Service Worker → TODO

4. **Arkkitehtuuriset päätökset**
   - Supabase vs. AWS RDS? → **Supabase** (managed, cost-effective)
   - Upstash vs. AWS ElastiCache? → **Upstash** (serverless, pay-per-call)
   - SSE vs. WebSocket vs. Polling? → **SSE** (simpler, one-way push)
   - Mapbox vs. Leaflet vs. Deck.gl? → **Mapbox** (clustering, performance)

---

## 12. API-DOKUMENTAATIO (QUICK REFERENCE)

### GET /api/traffic
```bash
curl http://localhost:3000/api/traffic

Vastaus: GeoJSON FeatureCollection
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [24.9, 60.2] },
      "properties": {
        "id": "traffic-GUID123",
        "type": "accident",
        "category": "accident",
        "title": "Liikenneonnettomuus...",
        "severity": "high",
        "timestamp": "2026-02-04T12:00:00Z",
        ...
      }
    }
  ]
}

Headers:
  - X-Cache: HIT | MISS (cache status)
  - Cache-Control: public, max-age=60
```

---

**Lopetusviesti agentille:**

> Käytä tätä dokumentaatiota roadmap-suunnittelun pohjana. Dokumentti sisältää:
> - Arkkitehtuurin yleiskatsaus
> - Frontend/Backend erottelu
> - Tietokanta-rakenne ja historia-logiikka
> - Caching-strategia (Redis)
> - Polling-ongelmat ja SSE-ratkaisu
> - Kriittiset tiedostot ja niiden status
> - P0/P1/P2 -priorisointi
>
> Tutustu erityisesti **kohtiin 8-11** roadmap-suunnittelua tehdessäsi!
