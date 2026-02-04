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
