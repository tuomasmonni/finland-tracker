# Tilannetieto.fi

Suomen reaaliaikainen tilannekuvakartta - yhdistää rikostilastot, liikennetiedot, sään ja kelikamerat yhdelle kartalle.

## Domainit

| Domain | Rooli |
|--------|-------|
| **tilannetieto.fi** | Tuotanto (main branch) |
| **datasuomi.fi** | Dev/staging (dev branch) |
| **finscope.fi** | Vapaa |

## Teknologia

- **Next.js 16** - React-pohjainen full-stack framework
- **React 19** - UI komponentit
- **TypeScript 5** - Tyyppiturva
- **Mapbox GL JS 3** - Kartavisualisointi
- **Tailwind CSS 4** - Styling
- **Vercel** - Hosting & auto-deploy
- **Vercel Analytics** - Käyttäjäseuranta

## Datalähteet

| Lähde | Data | Tyyppi |
|-------|------|--------|
| **Tilastokeskus** | Rikostilastot (ICCS) | Staattinen JSON |
| **Fintraffic** | Liikenneilmoitukset | Reaaliaikainen API |
| **Digitraffic** | Tiesää, kelikamerat | Reaaliaikainen API |
| **FMI** | Sääasemat | Reaaliaikainen API |
| **HSL** | Joukkoliikenne | Reaaliaikainen API |

## Rakenne

```
tilannetieto.fi/
├── app/                  # Next.js App Router
│   ├── page.tsx         # Pääsivu (kartta)
│   ├── layout.tsx       # Root layout + Analytics
│   └── api/             # API endpoints
│       ├── crime-stats/ # Rikostilastot
│       ├── traffic/     # Liikennetiedot
│       ├── weather/     # Sääasemat (FMI)
│       ├── road-weather/# Tiesääasemat
│       ├── weathercam/  # Kelikamerat
│       └── transit/     # Joukkoliikenne (HSL)
│
├── components/
│   ├── map/             # Karttakomponentit + layerit
│   └── ui/              # UI-komponentit
│
├── lib/
│   ├── contexts/        # UnifiedFilterContext (state management)
│   ├── data/            # API-asiakkaat per datalähde
│   ├── constants.ts     # Vakiot
│   └── types.ts         # Tyyppimäärittelyt
│
└── data/static/         # Staattinen data (rikostilastot)
```

## Kehitys

```bash
# Lokaali kehitys vaatii .env.local (Mapbox-token)
npm install
npm run dev

# TAI käytä dev-branchia: push → datasuomi.fi päivittyy automaattisesti
```

### Deploy-työnkulku

```
feature-branch → merge → dev → datasuomi.fi (testaus)
                                    ↓ hyväksytty
                         merge → main → tilannetieto.fi (tuotanto)
```

## Tekijät

- **IMPERIUM AI** - Sovelluskehitys
- **Tilastokeskus** - Rikostilastot (CC BY 4.0)
- **Fintraffic / Digitraffic** - Liikenne & tiesää (CC BY 4.0)
- **FMI** - Säädata (CC BY 4.0)
- **Mapbox** - Karttainfrastruktuuri

---

**Tuotanto**: tilannetieto.fi | **Dev**: datasuomi.fi | **GitHub**: tuomasmonni/finland-tracker
