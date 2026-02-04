# Tilannekuva.online - Datasources Status

**Päivitetty:** 04.02.2026
**Status:** Phase 1 MVP päätös + Phase 2 suunnittelu

---

## ✅ VALMIIT DATASOURCE:T (5/10)

### 1. 🚗 **Traffic** - Liikennehäiriöt (FINTRAFFIC)
- **API:** `/api/traffic`
- **Data:** Onnettomuudet, ruuhkat, häiriöt
- **Päivitys:** Real-time (5-15 min)
- **Kuuluu:** MVP Phase 1
- **Status:** ✅ **TUOTANNOSSA**

### 2. ⛈️ **Weather** - Säätiedot (FMI)
- **API:** `/api/weather`
- **Data:** ~5000 asemaa, lämpö, tuuli, sade, kosteus, paine
- **Päivitys:** 5 minuuttia
- **Kuuluu:** MVP Phase 1
- **Status:** ✅ **TUOTANNOSSA**

### 3. 🌡️ **Road Weather** - Tiesää (Digitraffic)
- **API:** `/api/road-weather`
- **Data:** ~500 asemaa, ilman lämpö, tien pinta, näkyvyys
- **Päivitys:** 5 minuuttia
- **Kuuluu:** MVP Phase 1
- **Status:** ✅ **TUOTANNOSSA**

### 4. 🚌 **Transit** - Joukkoliikenne (HSL)
- **API:** `/api/transit`
- **Data:** 1000-2000 ajoneuvon reaaliaikaiset sijainnit
- **Päivitys:** 15 sekuntia
- **Kuuluu:** MVP Phase 1
- **Status:** ✅ **TUOTANNOSSA**

### 5. 🚨 **Crime Statistics** - Rikostilastot (Poliisi)
- **API:** `/api/crime-stats`
- **Data:** Rikokset per kunta, vuosittain (2020-2023)
- **Päivitys:** Kuukausittain
- **Kuuluu:** MVP Phase 1
- **Status:** ✅ **TUOTANNOSSA**

### 6. 📹 **Weather Cameras** - Liikennekamerat (Fintraffic)
- **API:** `/api/weathercam`
- **Data:** ~1000+ kameran sijainnit ja kuvaajat
- **Päivitys:** Real-time (kuvaajat)
- **Kuuluu:** MVP Phase 1
- **Status:** ✅ **TUOTANNOSSA**

---

## ⚠️ OSITTAIN VALMIS (1/10)

### #10 PAAVO - Sosioekonominen data (Tilastokeskus)
- **API:** `/api/paavo` (?)
- **Data:** Tulot, koulutus, työllisyys per postinumero
- **Status:** 🟡 **Selitetty, ei vielä implementoitu**
- **Prioriteetti:** Kiireellinen (korkea hyöty)

---

## ❌ PUUTTUVAT DATASOURCE:T (3/10)

### #1 – Social Media Geotags (Instagram/TikTok)
- **Vaikeus:** Korkea (API:n oikeudet, rate limiting)
- **Hyöty:** Korkea (trendit, väkimäärä)
- **Prioriteetti:** Q2-Q3

### #2 – Google Maps Popular Times
- **Vaikeus:** Korkea (maksullinen API, complexity)
- **Hyöty:** Korkea (reaaliaikainen tungostieto)
- **Prioriteetti:** Q2-Q3

### #9 – Teleoperaattori Heatmap (Sonera/Telia)
- **Vaikeus:** Hyvin korkea (neuvottelut, anonymisointi)
- **Hyöty:** Korkea (crowdintelligence)
- **Prioriteetti:** Q2-Q3

---

## 🎯 SEURAAVA PRIORITEETTI (Phase 2)

Seuraaville datasourcille **ei ole** valmiita API:a:

| Rank | Dataset | Helppous | Hyöty | Prioriteetti |
|------|---------|----------|-------|--------------|
| **1** | **PAAVO** | 8/10 | 10/10 | ASAP (viikko 1) |
| **2** | **Population Density** | 7/10 | 8/10 | Viikko 1-2 |
| **3** | **Air Quality** | 6/10 | 7/10 | Viikko 2 |
| **4** | **Housing Prices** | 6/10 | 9/10 | Viikko 2-3 |
| **5** | **Emergency Services** | 5/10 | 10/10 | Viikko 3 |
| **6** | **Tourist Locations** | 5/10 | 6/10 | Q1/Q2 |
| **7** | Google Maps Popular | 4/10 | 8/10 | Q2 |
| **8** | Social Media Geotags | 3/10 | 7/10 | Q2-Q3 |
| **9** | Teleoperaattori Heatmap | 2/10 | 8/10 | Q3 |

---

## 📝 KORJAUKSET DOKUMENTTIIN

### `/mnt/c/Dev/tilannekuva/docs/08_DATASET_VOTING.md`

**Päivitettävä:**
1. ✅ Crime Statistics → "JÖ TUOTANNOSSA" (ei äänestystä)
2. ✅ Weather → "JÖ TUOTANNOSSA" (ei äänestystä)
3. ✅ Road Weather → "JÖ TUOTANNOSSA" (ei äänestystä)
4. ✅ Transit → "JÖ TUOTANNOSSA" (ei äänestystä)
5. ✅ Weather Cameras → "JÖ TUOTANNOSSA" (ei äänestystä)
6. ⚠️ PAAVO → "Seuraavaksi toteutettava (P0)"
7. ➕ Lisää puuttuvat (Social Media, Google Maps, Telecom)

**Uusi rakenne:**
```
### VALMIIT (ei äänestettävät)
- Crime Stats ✅
- Weather ✅
- Road Weather ✅
- Transit ✅
- Weather Cameras ✅

### SEURAAVAKSI ÄÄNESTETTÄVÄT (5 kpl)
1. PAAVO (P0)
2. Population Density
3. Air Quality
4. Housing Prices
5. Emergency Services + Tourist Locations (valinta)
```

---

## 🚀 Seuraava askel

Haluatko että:
1. **Päivitän dokumenttia** vastaamaan todellista tilaa?
2. **Luon uuden backlog-dokumentin** näille 5 uudelle datasourcelle?
3. **Priorisoin Phase 2 roadmappia** PAAVO:n ja Population Densityn kanssa?

Vai haluat nähdä jokin muu dokumentti?

