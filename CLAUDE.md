# Tilannetieto.fi - Projektin ohjeet agentille

## Repo & Ympäristö

- **Repo:** `tuomasmonni/finland-tracker`
- **Remote:** `git@github.com:tuomasmonni/finland-tracker.git`
- **Vercel-projekti:** finland-tracker-v1 (tmo-8c3e6ad2), projekti-ID: prj_XpxhAkPTReHvHYWZVwWPemVWWCyn
- **Lokaali kehitys:** Ei toimi ilman `.env.local` (Mapbox-token puuttuu). Käytä dev/preview-brancheja testaukseen.

## Domainit ja roolit

| Domain | Branch | Rooli |
|--------|--------|-------|
| **tilannetieto.fi** | `main` | Tuotanto |
| **datasuomi.fi** | `dev` | Dev/staging — testaajille jaettava |
| **finscope.fi** | — | Vapaa / markkinointi |

## DEPLOY-SÄÄNNÖT (PAKOLLINEN)

**Kaikki kehitystyö kulkee AINA dev-branchin kautta. Mainiin EI commitoida suoraan.**

### Työnkulku

```
1. Luo feature-branch devistä (tai mainista)
2. Commitoi VAIN kyseiseen ominaisuuteen liittyvät muutokset
3. Push feature-branch → Vercel luo automaattisesti preview-linkin
4. Merge feature-branch → dev → datasuomi.fi (testaajat testaavat)
5. ODOTA käyttäjän hyväksyntä
6. Käyttäjän hyväksyttyä → listaa TARKASTI mitä menee tuotantoon
7. ODOTA käyttäjän vahvistus listaukselle
8. Vasta sitten: merge dev → main → push → tilannetieto.fi
```

### Ehdottomat säännöt

1. **Yksi ominaisuus per branch.** Älä niputa useita ominaisuuksia samaan committiin.
2. **Stashaa ylimääräiset.** Jos working treessä on muutoksia jotka EIVÄT liity käsiteltävään ominaisuuteen → `git stash` ENNEN commitointia.
3. **Listaa aina ennen pushia mainiin:**
   ```
   TUOTANTOON MENEE:
   - [commit-viesti]
   - Tiedostot: [tiedosto1, tiedosto2]
   - Ominaisuus: [lyhyt kuvaus]

   EI MENE TUOTANTOON:
   - [lokaalit muutokset X, Y, Z]
   ```
4. **Testaamaton koodi EI KOSKAAN tuotantoon.** Jokainen ominaisuus testataan datasuomi.fi:ssä ennen mergea mainiin.
5. **Älä oleta.** Jos käyttäjä sanoo "laita tuotantoon", varmista silti MITÄ laitetaan.

### Feature-branch nimeäminen

```
feature/[lyhyt-kuvaus]    esim. feature/dark-mode
fix/[bugin-kuvaus]        esim. fix/crime-calculation
```

### Merge-prosessi (kun käyttäjä hyväksynyt datasuomi.fi:ssä)

```bash
git checkout dev
git merge feature/x          # Feature deviin
git push origin dev           # → datasuomi.fi päivittyy

# Testauksen jälkeen, kun hyväksytty:
git checkout main
git merge dev --no-ff         # Dev mainiin
git push origin main          # → tilannetieto.fi päivittyy
```

## Tekniset muistiinpanot

- **Väkilukudata:** Tilastokeskus, "Väestö 31.12." joka vuodelle. Varmistettu oikeaksi.
- **Rikosdata:** Tilastokeskus ICCS-luokitus (`statfin_rpk_pxt_13kq.px`). Varmistettu oikeaksi.
- **Per 100k laskukaava:** `(totalCrimes / population) * 100000`
- **Staattinen data:** `data/static/crime-statistics.json` - ei API-kutsuja runtimessa
