# 🤖 Claude Agent Deployment Instructions
## Tilannekuva.online - Automated Deployment Pipeline

**Tarkoitus:** Automatisoida production deploymenttia Verceliin

---

## AGENT TASK CHECKLIST

### Phase 1: Pre-Deployment Checks
- [ ] Tarkista `/mnt/c/Dev/IMPERIUM/.git/` - onko repo clean?
  ```bash
  cd /mnt/c/Dev/IMPERIUM && git status
  ```
  ✅ **Expected:** "working tree clean" tai staged changes OK

- [ ] Varmista että `main` branch on valittu
  ```bash
  git branch | grep "* main"
  ```

- [ ] Tarkista viimeisin commit
  ```bash
  git log --oneline -1
  ```

### Phase 2: Build Verification (Local)
- [ ] Navigoi projektin juureen
  ```bash
  cd /mnt/c/Dev/IMPERIUM/2_KONSEPTIT/tilannekuva.online
  ```

- [ ] Tarkista build onnistuu
  ```bash
  npm run build
  ```
  ✅ **Expected:** "ready - started server on 0.0.0.0:3000, url: http://localhost:3000"

- [ ] Jos build fails:
  - [ ] Lue error message kokonaan
  - [ ] Tarkista TypeScript errors
  - [ ] Korjaa ja commitoi uudelleen

### Phase 3: Push to Production
- [ ] Varmista kaikki commitit on pushattu
  ```bash
  git push origin main
  ```
  ✅ **Expected:** "Everything up-to-date" tai "[main xxxxxxx..yyyyyy] main -> main"

- [ ] Tarkista push onnistui
  ```bash
  git log origin/main --oneline -1
  ```

### Phase 4: Manual Vercel Deploy (IF webhook fails)
- [ ] **VAIN JOS** Vercel ei deployaa automaattisesti 10 min jälkeen

- [ ] Asenna Vercel CLI (jos ei ole)
  ```bash
  npm install -g vercel
  ```

- [ ] Deploy to production
  ```bash
  cd /mnt/c/Dev/IMPERIUM/2_KONSEPTIT/tilannekuva.online
  vercel --prod
  ```
  ✅ **Expected:** "Deployment complete! https://tilannekuva.online"

### Phase 5: Post-Deployment Validation
- [ ] Odota 2-3 minuuttia

- [ ] Tarkista production site
  ```bash
  curl -s https://tilannekuva.online | grep -i "kelikamerat\|liikenne" | head -1
  ```
  ✅ **Expected:** HTML content joka sisältää sovelluksen componentit (ei "Under construction")

- [ ] Hard refresh Vercelissä
  - Avaa https://tilannekuva.online
  - Paina `Ctrl+Shift+R` (tai `Cmd+Shift+R` Mac)
  - Varmista että UI näyttää uusimmat muutokset

- [ ] Tarkista key features
  - [ ] 🚗 LIIKENNE filter näkyvissä
  - [ ] 🔴 RIKOSTILASTOT filter näkyvissä
  - [ ] 📷 KELIKAMERAT filter näkyvissä
  - [ ] Weather camera icons näkyvät kartalla (jos ON)

### Phase 6: Verify All 3 Features
- [ ] Liikennetapahtumat
  - Toggle ON → ikonit näkyvät kartalla
  - Toggle OFF → ikonit katoavat

- [ ] Rikostilastot
  - Toggle ON → choropleth layer näkyvissä
  - Toggle OFF → layer pois näkyvistä

- [ ] Kelikamerat
  - Toggle ON → ~780 blue camera icons ilmestyvät
  - Click icon → modal avautuu kuvilla
  - Toggle OFF → ikonit katoavat

---

## TROUBLESHOOTING MATRIX

| Ongelma | Tarkista | Ratkaisu |
|---------|----------|----------|
| Build fails | npm run build output | Tarkista TypeScript errors, korjaa, uusi commit |
| Vercel ei deployaa 10min jälkeen | Vercel dashboard Deployments | Käynnistä `vercel --prod` manuaalisesti |
| Sivusto näyttää "Under construction" | curl https://tilannekuva.online | Clear Varnish cache tai odota 5 min |
| Features eivät näy | Browser console (F12) | Check for JS errors, hard refresh (Ctrl+Shift+R) |
| API 404 errors | Console → Network tab | Tarkista /api/weathercam, /api/traffic responses |

---

## AUTOMATED DEPLOYMENT WORKFLOW

**Kun agentti saa komennon "deploy":**

```
1. Check git status ✅
2. Run: npm run build
3. Push: git push origin main
4. Wait 10 minutes
5. curl https://tilannekuva.online (verify content)
6. If fail → vercel --prod
7. Validate 3 features work
8. Report status to user
```

---

## SUCCESS CRITERIA ✅

Deployment on onnistunut kun:

1. ✅ `git push origin main` onnistuu
2. ✅ `npm run build` ei virheitä
3. ✅ https://tilannekuva.online responds 200 OK
4. ✅ HTML content sisältää: "kelikamerat", "liikenne", "rikostilastot"
5. ✅ Kaikki 3 filtteri-moduulia toimivat:
   - Näkyvät FilterPanel:ssa
   - Toggle ON/OFF muuttaa kartalla näkyvää
   - Varjot/ikonit ilmestyvät/katoavat oikein

---

## AGENT RESPONSE FORMAT

Raportti deploymentista:

```
✅ DEPLOYMENT COMPLETE

Status: [SUCCESS / FAILED]
Commit: [hash]
Deployed: [timestamp]
Production URL: https://tilannekuva.online

Features Verified:
✅ Liikenne (Traffic)
✅ Rikostilastot (Crime)
✅ Kelikamerat (Weather Cameras)

Notes: [Jos ongelmia, listaa tässä]
```

---

**Versio:** 1.0
**Päivitetty:** 2026-02-04
**Teknologia:** Next.js 16 + Vercel + Mapbox GL
