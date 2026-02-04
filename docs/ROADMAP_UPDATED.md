# Tilannekuva.online - Päivitetty Roadmap (Quick Wins + Phases)

**Päivämäärä:** 04.02.2026
**Status:** MVP valmis + Quick Wins suunniteltu
**Kokonaiskesto:** 13 viikkoa (Quick Wins + Phases 1-4)

---

## 📊 PÄIVITETTY ROADMAP

```
TÄMÄ VIIKKO (Viikko 0): Quick Wins - MVP Polish
├─ Dark Mode Toggle        (1.5h)
├─ Layer Opacity Control   (1.5h)
├─ Favorites/Bookmarks     (2h)
├─ Custom Time Range       (2h)
└─ Export Data             (2h)
    └─ YHTEENSÄ: 9 tuntia → MVP GLOSS READY

VAIHE 1: MVP Monetization (Viikot 1-4)
├─ Auth + User Management (Supabase)
├─ User Dashboard
└─ Ilmainen rekisteröinti LIVE
    └─ Tavoite: 1,000 aktiivista käyttäjää

VAIHE 2: API Infrastructure (Viikot 5-8)
├─ API Key Management
├─ Rate Limiting
├─ API Documentation
└─ Maksulliset API-tasot READY
    └─ Tavoite: B2B validointi

VAIHE 3: Premium Features (Viikot 9-12)
├─ User Alerts
├─ Historical Data
├─ Advanced Export
└─ Admin Dashboard
    └─ Tavoite: Monitisointi-ready

VAIHE 4: B2B Sales & Monetization (Kk 4+)
├─ Stripe Integration
├─ Sales & Marketing
└─ Enterprise Features
    └─ Tavoite: €6,400+ MRR
```

---

## 🎯 VIIKKO 0 - QUICK WINS (MVP Polish)

### Tavoite
Kiillottaa MVP ennen autentikaatiovaiheeseen menemistä. Käyttäjät näkevät **välittömiä parannuksia**.

### Tulokset
- ✅ Dark mode toimii
- ✅ Layer opacity sliders
- ✅ Favorites sidebar
- ✅ Custom time range picker
- ✅ CSV/GeoJSON export buttons

### Priorisoitu Järjestys

#### Viikko 0, Päivä 1-2: Dark Mode + Opacity (3h) - **P0**
```
DONE:
├─ Lisää 🌙 toggle Headeriin
├─ Implementoi dark/light classes Tailwindillä
├─ Vaihda Mapbox theme (dark ↔ light)
├─ Tallenna localStorage
└─ Test mobiiliksi

OPACITY:
├─ Layer-kohtainen opacity slider
├─ Mapbox setPaintProperty integration
├─ Tallennus localStorage
└─ Visual feedback
```

**Implementoitavat tiedostot:**
- `components/ui/Header.tsx` - Theme toggle painike
- `lib/hooks/useTheme.ts` - Theme state management
- `components/map/LayerOpacityControl.tsx` - Uusi komponentti
- `app/globals.css` - Dark mode styles

#### Viikko 0, Päivä 3-4: Favorites + Time Range (4h) - **P1**
```
FAVORITES:
├─ ⭐ painike tapahtuman popup:issa
├─ Favorites sidebar vasemmalla
├─ localStorage persistence
└─ Klikkaa togglea favorite/unfavorite

CUSTOM TIME RANGE:
├─ Radio buttons (2h, 8h, 24h, 7d, Custom)
├─ Date/Time pickers "Custom":lle
├─ Filter events by date range
└─ localStorage muistaa valinta
```

**Implementoitavat tiedostot:**
- `lib/hooks/useFavorites.ts` - Favorite management
- `components/ui/FavoritesSidebar.tsx` - Uusi sidebar
- `lib/hooks/useTimeRange.ts` - Time range logic
- `components/ui/FilterPanel.tsx` - Päivitys

#### Viikko 0, Päivä 5: Export Data (2h) - **P2**
```
EXPORT BUTTONS:
├─ [📥 CSV] - Download events.csv
├─ [📊 GeoJSON] - Download events.geojson
└─ [📋 JSON] - Download events.json

CSV FORMAT:
id,title,category,lat,lon,timestamp
traffic-123,Onnettomuus,accident,60.15,24.95,2026-02-04T10:00:00Z

GEOJSON: Standard Feature Collection
```

**Implementoitavat tiedostot:**
- `lib/export/csv.ts` - CSV export
- `lib/export/geojson.ts` - GeoJSON export
- `components/ui/ExportButton.tsx` - Export buttons
- `components/ui/FilterPanel.tsx` - Päivitys

---

## ✅ ONNISTUMISEN KRITEERIT (Quick Wins)

- [ ] Dark mode toimii kaikilla laitteilla
- [ ] Opacity slider ei vaikuta muihin layereihin
- [ ] Favorites tallennetaan ja ladataan oikein
- [ ] Custom time range suodattaa tapahtumat oikein
- [ ] Export toimii > 1000 tapahtumalle
- [ ] Mobile responsive (kaikki komponentit)
- [ ] Ei performance regression (<3s load time)

---

## 📈 USER IMPACT (Quick Wins)

| Feature | User Benefit | Analytics |
|---------|--------------|-----------|
| Dark Mode | Silmien väsymys vähenee (-30% eye strain) | Toggle clicks |
| Opacity | Nähdään multiple layers samalla (-50% confusion) | Opacity value changes |
| Favorites | Nopea pääsy suosikki-paikkoihin (-2min per session) | Favorite toggles |
| Time Range | Tarkempi filtteröinti (custom needs: -70% complaints) | Range selections |
| Export | Data analysis offline (B2B käyttö) | Download counts |

---

## 🚀 Seuraavaksi: VAIHE 1 (Viikot 1-4)

Kun Quick Wins on valmis:
1. MVP on **kiillottava** ja käyttäjäystävällinen
2. Valmiina **Authentication**-vaiheeseen
3. Käyttäjät ovat **iloisia** ja **engaged**
4. Base on **solid** ennen auth complexity:a

---

## 📚 Dokumentit

| Dokumentti | Kuvaus |
|-----------|--------|
| `QUICK_WINS_FEATURES.md` | Yksityiskohtaiset feature specs |
| `IMPLEMENTATION_PHASES.md` | Original roadmap (Phase 1-4) |
| `IMPLEMENTATION_STATUS.md` | MVP status |
| `DATASOURCES_STATUS.md` | Valmiit datasourcet + seuraavat |

---

**Strategia:** Quick Wins → MVP Polish → Auth Phase → B2B Ready

