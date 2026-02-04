# Tilannekuva.online - 5 Quick Wins (UI/UX Helpot)

**Päivämäärä:** 04.02.2026
**Vaihe:** MVP + Phase 1 (ennen autentikaatiota)
**Tavoite:** Parantaa käyttäjäkokemusta nopeasti, ennen heavy lifting (auth)
**Yhteensä:** ~10 tuntia työtä

---

## 📌 MIKSI NÄMÄ OMINAISUUDET?

✅ **Helpot tehdä** (UI/UX, no backend)
✅ **Suuri hyöty** (käyttäjät haluavat)
✅ **Nopea ROI** (1-2h per feature)
✅ **Quick wins** (näkyvät muutokset)
✅ **Valmistus** (ennen auth-vaiheeseen)

---

## 🎯 5 EHDOTETTUA OMINAISUUTTA

### 🥇 #1 – DARK/LIGHT MODE TOGGLE

**Helppous:** 🟢🟢🟢🟢🟢🟢🟢🟢 (8/10)
**Aika:** ⏱️ 1.5 tuntia
**Hyöty:** Silmien väsymys vähenee yöllä

**Mikä tehdään:**
```
┌─────────────────────────┐
│ 🌍 Tilannekuva.online │ 🌙 ← Click tämä
├─────────────────────────┤
│ Tumma tausta            │
│ Valkea teksti           │
└─────────────────────────┘
```

**Teknisesti:**
- Lisää `🌙 Dark mode` / `☀️ Light mode` toggle Headeriin
- Vaihda `bg-white` ↔ `bg-zinc-950` (Tailwind)
- Vaihda `text-black` ↔ `text-white`
- Mapbox theme vaihto (dark ↔ light)
- localStorage: muista valinta

**Implementation:**
```typescript
// lib/hooks/useTheme.ts
const [theme, setTheme] = useState<'dark' | 'light'>(() => {
  return localStorage.getItem('theme') || 'light';
});

useEffect(() => {
  localStorage.setItem('theme', theme);
  document.documentElement.classList.toggle('dark', theme === 'dark');
}, [theme]);
```

**Käyttäjät haluavat:** "Myöhään illalla käytettäessä silmiin helpompi"

---

### 🥈 #2 – EXPORT DATA (CSV/GeoJSON)

**Helppous:** 🟢🟢🟢🟢🟢🟢 (6/10)
**Aika:** ⏱️ 2 tuntia
**Hyöty:** Käyttäjät voivat analysoida dataa Excelissä

**Mikä tehdään:**
```
┌──────────────────────────┐
│ 📥 Lataa CSV             │
│ 📊 Lataa GeoJSON         │
│ 📋 Lataa JSON            │
└──────────────────────────┘

Lataa events.csv:
id,title,category,lat,lon,timestamp
traffic-123,Onnettomuus,accident,60.15,24.95,2026-02-04T10:00:00Z
crime-456,Varkaus,crime,60.17,24.93,2026-02-04T09:30:00Z
weather-789,Sade,weather,60.16,24.94,2026-02-04T10:15:00Z
```

**Teknisesti:**
```typescript
// lib/export/csv.ts
export function eventsToCSV(events: NormalizedEvent[]): string {
  const headers = ['id', 'title', 'category', 'lat', 'lon', 'timestamp'];
  const rows = events.map(e => [
    e.id, e.title, e.category,
    e.location.coordinates[1], e.location.coordinates[0],
    e.timestamp
  ]);
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// components/ui/ExportButton.tsx
const handleExport = (format: 'csv' | 'geojson' | 'json') => {
  let data = '';
  let filename = '';

  if (format === 'csv') {
    data = eventsToCSV(visibleEvents);
    filename = 'events.csv';
  } else if (format === 'geojson') {
    data = JSON.stringify(eventsToGeoJSON(visibleEvents), null, 2);
    filename = 'events.geojson';
  }

  const blob = new Blob([data], { type: 'text/plain' });
  downloadFile(blob, filename);
};
```

**Käyttäjät haluavat:** "Haluan analysoida dataa omassa taulukossa"

---

### 🥉 #3 – FAVORITES / BOOKMARKS

**Helppous:** 🟢🟢🟢🟢🟢🟢 (6/10)
**Aika:** ⏱️ 2 tuntia
**Hyöty:** Nopea pääsy kiinnostaviin paikkoihin

**Mikä tehdään:**
```
Klikkaa tapahtumaa → "⭐ Lisää suosikki"
↓
Sivun vasemmassa yläkulmassa näkyy "⭐ Suosikit (3)"
↓
Click → näyttää 3 klikkauksella tallennettua paikkaa

NÄYTÖSSÄ:
┌─────────────────────────┐
│ ⭐ Suosikit (3)         │
│ ├─ Hakaniemi (112.3°)   │
│ ├─ Kallio (112.5°)      │
│ └─ Kaivopuisto (112.1°) │
└─────────────────────────┘
```

**Teknisesti:**
```typescript
// lib/hooks/useFavorites.ts
const [favorites, setFavorites] = useState<FavoriteLocation[]>(() => {
  const saved = localStorage.getItem('favorites');
  return saved ? JSON.parse(saved) : [];
});

const toggleFavorite = (location: Location) => {
  setFavorites(prev => {
    const exists = prev.some(f => f.id === location.id);
    const updated = exists
      ? prev.filter(f => f.id !== location.id)
      : [...prev, location];
    localStorage.setItem('favorites', JSON.stringify(updated));
    return updated;
  });
};
```

**Käyttäjät haluavat:** "Muista missä asun ja missä käyn usein"

---

### 🎯 #4 – CUSTOM TIME RANGE PICKER

**Helppous:** 🟢🟢🟢🟢🟢🟢🟢 (7/10)
**Aika:** ⏱️ 2 tuntia
**Hyöty:** Käyttäjä valitsee tarkan aikavälin

**Mikä tehdään:**
```
NYKYINEN: "2h", "8h", "24h", "7d", "Kaikki"
UUSI: "Mukautettu" -optio → date picker

┌──────────────────────────┐
│ Aikaväli                 │
│ ◉ 2h      ◯ 8h   ◯ 24h │
│ ◯ 7d      ◯ Kaikki      │
│ ◯ Mukautettu             │
│   [Alku]  -  [Loppu]     │
│   [Date]     [Time]      │
└──────────────────────────┘
```

**Teknisesti:**
```typescript
// lib/hooks/useTimeRange.ts
interface TimeRange {
  preset: 'today' | '2h' | '8h' | '24h' | '7d' | 'all' | 'custom';
  startDate?: Date;
  endDate?: Date;
}

const getFilteredEvents = (range: TimeRange) => {
  const now = new Date();
  let startDate = new Date();

  switch(range.preset) {
    case '2h': startDate.setHours(startDate.getHours() - 2); break;
    case '8h': startDate.setHours(startDate.getHours() - 8); break;
    case '24h': startDate.setDate(startDate.getDate() - 1); break;
    case '7d': startDate.setDate(startDate.getDate() - 7); break;
    case 'custom': startDate = range.startDate!; break;
  }

  return events.filter(e =>
    new Date(e.timestamp) >= startDate &&
    new Date(e.timestamp) <= (range.endDate || now)
  );
};
```

**Käyttäjät haluavat:** "Haluan nähdä vain tämän päivän keskipäivän jälkeen"

---

### 🎨 #5 – LAYER OPACITY CONTROL

**Helppous:** 🟢🟢🟢🟢🟢🟢🟢🟢 (8/10)
**Aika:** ⏱️ 1-2 tuntia
**Hyöty:** Nähdään kahden layerin alle kerralla

**Mikä tehdään:**
```
┌──────────────────────────┐
│ ☑️ 🚗 Liikenne           │
│    [========○==] 70%     │  ← Slider
│                          │
│ ☑️ ⛈️ Sää               │
│    [=====○=====] 50%     │  ← Slider
│                          │
│ ☑️ 🚌 Joukkoliikenne     │
│    [===========○] 85%    │  ← Slider
└──────────────────────────┘
```

**Teknisesti:**
```typescript
// components/map/LayerOpacityControl.tsx
const handleOpacityChange = (layerId: string, opacity: number) => {
  map?.setPaintProperty(
    `${layerId}-layer`,
    'circle-opacity',
    opacity / 100
  );
  setLayerOpacities(prev => ({
    ...prev,
    [layerId]: opacity
  }));
  localStorage.setItem('layerOpacities',
    JSON.stringify({ ...layerOpacities, [layerId]: opacity }));
};
```

**Käyttäjät haluavat:** "Nähdä liikennetapahtumat sään alta"

---

## 📊 ROADMAP-INTEGRAATIO

### Ennen Phase 2 (Auth)

```
VAIHE 1 (MVP) ✅ - Valmis
├─ Traffic API
├─ Weather API
├─ Crime Stats
├─ Transit API
├─ Road Weather
└─ Weather Cameras

VAIHE 1.5 (Quick Wins) ← SEURAAVAKSI
├─ Dark Mode Toggle         (1.5h)
├─ Export Data              (2h)
├─ Favorites/Bookmarks      (2h)
├─ Custom Time Range        (2h)
└─ Layer Opacity Control    (1.5h)
    └─ YHTEENSÄ: 9 tuntia → MVP on **kiillottava**

VAIHE 2 (Auth) - Seuraavaksi
├─ Supabase Auth
├─ User Dashboard
├─ Profile Management
└─ 1,000 aktiivista käyttäjää
```

---

## ✅ IMPLEMENTATION PRIORITIZATION

| Rank | Feature | Helppous | Impact | Aika | Priority |
|------|---------|----------|--------|------|----------|
| 1 | Dark Mode | 8/10 | 8/10 | 1.5h | P0 |
| 2 | Layer Opacity | 8/10 | 7/10 | 1.5h | P0 |
| 3 | Favorites | 6/10 | 7/10 | 2h | P1 |
| 4 | Time Range | 7/10 | 6/10 | 2h | P1 |
| 5 | Export Data | 6/10 | 6/10 | 2h | P2 |

---

## 🚀 SEURAAVAT ASKELET

### Viikko 1: Dark Mode + Opacity Control (3h)
- Nopea wins
- Käyttäjät näkevät muutoksia heti
- Valmistus seuraaviksi

### Viikko 2: Favorites + Time Range (4h)
- Parempi UX
- Käyttäjät voivat säädellä kokemusta

### Viikko 3: Export Data (2h)
- Power users hyötyvät
- Analyysi-orientoituneet käyttäjät
- CSV/GeoJSON/JSON

### Viikko 4: Testing + Polish
- Responsiivinen design
- Mobile optimization
- Bug fixes

### Viikko 5+: Phase 2 Auth Start

---

## 💡 MIKSI TÄMÄ STRATEGIA?

✅ **MVP kiillotetaan** ennen autentikaatiota
✅ **Käyttäjät näkevät muutoksia** -> engagement nousee
✅ **Valmistus Phase 2:een** (auth ei silti pullaa)
✅ **Nopea toteutus** - kaikki 9 tuntia
✅ **Suuri hyöty** - käyttäjät haluavat nämä

---

**Ehdotus:** Toteuta Quick Wins *ennen* Phase 2:n autentikaatiota. MVP parantuu merkittävästi, käyttäjät ovat tyytyväisempiä, ja auth:n kohtaamisessa sovellus on paremmin valmistautunut.

