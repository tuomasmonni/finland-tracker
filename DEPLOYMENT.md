# Tilannekuva.online - Deployment Guide

## Vercel Deployment (Suositeltu)

### 1. Valmistelu

```bash
cd /mnt/c/Dev/IMPERIUM/2_KONSEPTIT/tilannekuva.online

# Varmista että build onnistuu
npm run build

# Varmista että git on valmis
git add .
git commit -m "Tilannekuva.online initial commit"
```

### 2. GitHub Repositories

```bash
# Luo uusi repo GitHub:iin tai GitHub CLI:lla
gh repo create tilannekuva-online --public

# Push koodiin
git remote add origin https://github.com/[USERNAME]/tilannekuva-online.git
git branch -M main
git push -u origin main
```

### 3. Vercel Setup

1. Mene https://vercel.com/new
2. Valitse "Import Git Repository"
3. Valitse tilannekuva-online repo
4. Configure:
   - **Framework**: Next.js
   - **Project name**: tilannekuva
   - **Build Command**: `npm run build`
   - **Install Command**: `npm install --legacy-peer-deps`

### 4. Environment Variables

Vercel dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
```

### 5. Deploy

Klikkaa "Deploy" → Vercel deployaa automaattisesti

Deployment URL: `https://tilannekuva.vercel.app`

## Custom Domain (tilannekuva.online)

### 1. Domain Setup

Vercel → Project Settings → Domains:
1. Klikkaa "Add"
2. Syötä `tilannekuva.online`
3. Seuraa DNS instructions

### 2. DNS Configuration

Domainin registraattorissa (esim. Namecheap):

```
CNAME: tilannekuva.online -> cname.vercel-dns.com
```

Tai käytä Vercel nameservers:
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

## Alternative: Docker + VPS

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

EXPOSE 3000

ENV NODE_ENV production

CMD ["npm", "start"]
```

### Deploy to VPS

```bash
# Build docker image
docker build -t tilannekuva .

# Run container
docker run -d \
  -p 3000:3000 \
  -e NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1... \
  --name tilannekuva \
  tilannekuva

# Proxy nginx
# Location /etc/nginx/sites-enabled/tilannekuva:
# server {
#   server_name tilannekuva.online;
#   location / {
#     proxy_pass http://localhost:3000;
#     proxy_set_header Host $host;
#   }
# }
```

## CI/CD Pipeline

### GitHub Actions

Tiedosto: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Vercel CLI
        run: npm install -g vercel

      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
        run: vercel deploy --prod
```

### Environment Secrets

GitHub → Settings → Secrets:
- `VERCEL_TOKEN` (from vercel.com/account/tokens)
- `VERCEL_ORG_ID` (Vercel CLI: `vercel teams list`)
- `VERCEL_PROJECT_ID` (Vercel project settings)

## Performance Optimization

### 1. Build Optimization

```bash
# Analyze bundle size
npm install --save-dev @next/bundle-analyzer

# Use in next.config.ts:
# const withBundleAnalyzer = require('@next/bundle-analyzer')({
#   enabled: process.env.ANALYZE === 'true',
# })
# ANALYZE=true npm run build
```

### 2. Caching Strategy

API Cache headers:
- Crime stats: `max-age=3600` (1h)
- Traffic live: `max-age=60` (1min)
- History: `max-age=300` (5min)

### 3. Image Optimization

- Mapbox tiles: Cached by Mapbox CDN
- Crime GeoJSON: Gzip compressed
- Traffic GeoJSON: Streaming

## Monitoring

### Vercel Analytics

Vercel dashboard → Analytics tab

Seuraa:
- Page load times
- API response times
- Error rates

### Custom Analytics

Lisää Plausible tai Umami:

```typescript
// components/Analytics.tsx
import { useEffect } from 'react';

export default function Analytics() {
  useEffect(() => {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://plausible.io/js/plausible.js';
    script.setAttribute('data-domain', 'tilannekuva.online');
    document.body.appendChild(script);
  }, []);

  return null;
}
```

## Troubleshooting

### Build Timeout

Vercel:
- Settings → Build & Development Settings
- Functions → Timeout: 60s

### Memory Issues

Mapbox GeoJSON on heavy:
- Crime data: 304 KB
- Traffic data: ~100 KB

Ratkaisu: Käytä GeoJSON tiling (mapbox-gl-js feature)

### API Rate Limits

Fintraffic:
- No rate limit (ilmainen)

Tilastokeskus:
- 10 requests per second recommended
- Käytä caching

## Security

### Environment Secrets

Älä koskaan pushaa `.env.local`!

```bash
# .gitignore
.env.local
.env.*.local
.next
node_modules
```

### Content Security Policy

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self' https://api.mapbox.com https://events.mapbox.com"
  }
];
```

### CORS

Fintraffic:
- CORS-enabled public API
- No authentication needed

Tilastokeskus:
- Public API
- Rate limit friendly

## Ulkoiset palvelut ja kustannukset

> **Päivitetty:** 06.02.2026

### Maksulliset palvelut (token/avain tarvitaan)

| Palvelu | Käyttö | Free Tier | Hinta skaalauksessa | Env-muuttuja | Status |
|---------|--------|-----------|---------------------|--------------|--------|
| **Mapbox** | Karttanäkymä (GL JS) | 50 000 karttanäyttöä/kk | ~$5-50/kk riippuen käytöstä | `NEXT_PUBLIC_MAPBOX_TOKEN` | Luottokortti lisätty 06.02.2026, Pay-as-you-go |
| **Vercel** | Hosting (Next.js) | 100 GB BW, 100k func calls/kk | Pro $20/kk, BW $40/100GB | - | Hobby-tili käytössä |
| **Upstash Redis** | API-vastausten välimuisti | 10 000 komentoa/pv, 256 MB | $0.20+/pv | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Käytössä, vähentää 95% API-kutsuja |
| **Anthropic Claude** | Uutisten AI-analyysi (Haiku) | Ei free tieriä | ~$0.01/artikkeli | `ANTHROPIC_API_KEY` | Lisätty 06.02.2026, fallback keyword-analyysi toimii ilman |
| **Supabase** | PostgreSQL-tietokanta | 500 MB, 2 GB BW | $25+/kk | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Konfiguroitu, EI vielä aktiivisessa käytössä |

### Ilmaiset palvelut (ei tokenia, ei rajoituksia)

| Palvelu | Käyttö | Data |
|---------|--------|------|
| **FMI (Ilmatieteen laitos)** | Sääasemat, lumitilanne | ~200 sääasemaa, 5 min polling |
| **Fintraffic Digitraffic** | Liikenne, tiesää, kelikamerat | ~185 tapahtumaa, ~520 tiesää-asemaa, ~780 kameraa |
| **HSL Digitransit** | Joukkoliikenne (GTFS-RT) | ~1000 ajoneuvoa, 15s polling |
| **Tilastokeskus PxWeb** | Rikostilastot, väkiluvut, kuntarajat | Staattinen data + WFS-rajapinta |
| **RSS-syötteet** | Uutiset (YLE, IL, MTV) | 15 min polling |

### Skaalausriskikohdat (kun käyttäjiä tulee paljon)

1. **Mapbox** — Ensimmäinen pullonkaula. 50k ilmaista näyttöä/kk = ~1 700/pv. Jos sovellus saa medianäkyvyyttä, ylittyy nopeasti. **Arvio: $50-200/kk @ 10k käyttäjää/pv.**

2. **Vercel** — Hobby-tilin 100 GB BW ja 100k function calls riittävät alkuun, mutta ~5k DAU:n jälkeen Pro-tilille ($20/kk) siirtyminen välttämätöntä. Serverless function timeout myös kasvaa 10s → 60s.

3. **Upstash Redis** — Free tier (10k komentoa/pv) riittää yhdelle käyttäjälle hyvin, mutta jokainen API-reitti tekee cache-kutsuja. **Arvio: Pay-as-you-go ~$5-15/kk @ 10k DAU.**

4. **Anthropic API** — Uutisanalyysi pyörii serveripuolella, ei skaalaudu käyttäjien mukaan (yksi haku/15 min). **Arvio: ~$5-10/kk vakio.**

5. **Supabase** — Ei vielä käytössä, mutta jos historia-/käyttäjädata otetaan käyttöön, $25/kk Pro-tili tarpeen.

### Yhteenveto kustannuksista

| Skenaario | Mapbox | Vercel | Redis | Claude | Yht. |
|-----------|--------|--------|-------|--------|------|
| **Nyt (dev/beta)** | $0 | $0 | $0 | ~$5 | ~$5/kk |
| **~1k DAU** | ~$20 | $0 | ~$5 | ~$5 | ~$30/kk |
| **~10k DAU** | ~$100 | $20 | ~$15 | ~$10 | ~$145/kk |
| **~50k DAU** | ~$400 | $20+ | ~$30 | ~$10 | ~$460/kk |

---

## Rollback

### Vercel Rollback

Vercel Dashboard → Deployments → Click previous → Revert

### Manual Rollback

```bash
git revert <commit-hash>
git push origin main
# Vercel auto-deploys
```

---

**Version**: 0.1.0
**Last Updated**: 04.02.2026
