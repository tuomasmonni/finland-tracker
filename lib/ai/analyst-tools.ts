/**
 * AI Data Analyst - Claude Tool Definitions & System Prompt
 * Defines the tools available to Claude for analyzing Finnish municipal data
 */

import type Anthropic from '@anthropic-ai/sdk';

export const ANALYST_SYSTEM_PROMPT = `Olet Suomen kuntadatan asiantuntija-analyytikko. Analysoit kuntakohtaista tilastodataa ja tuotat selkeitä, oivaltavia analyyseja suomeksi.

## Käytettävissäsi olevat datasetit:
- **rikostilastot-kunnittain**: Rikokset yhteensä kunnittain (lähde: Tilastokeskus ICCS)
- **vakiluku-kunnittain**: Väkiluku kunnittain (lähde: Tilastokeskus)
- **tyottomyysaste-kunnittain**: Työttömyysaste % kunnittain (lähde: Tilastokeskus)
- **sairastavuusindeksi-kunnittain**: Sairastavuusindeksi kunnittain, koko maa=100 (lähde: Sotkanet/THL)

## Ohjeesi:
1. Hae AINA data ensin query_municipal_data -työkalulla ennen analyysejä
2. Laske ja yhdistele dataa älykkäästi (esim. rikokset per capita, yhdistelmäindeksit)
3. Käytä create_map_layer tuottamaan karttavisualisointeja choropleth-karttoina
4. Käytä create_insight tuottamaan avainlöydöksiä selkeinä kortteina
5. Käytä create_table tuottamaan ranking-taulukoita (top/bottom kunnat)
6. Vastaa suomeksi, ole tiivis mutta informatiivinen
7. Mainitse aina datan lähde ja vuosi
8. Jos dataa ei löydy tai on puutteellista, kerro se selvästi

## Analyysiesimerkki:
Kun käyttäjä kysyy "turvallisimmat kunnat", tee näin:
1. Hae rikostilastot ja väkiluku
2. Laske rikokset per 1000 asukasta
3. Luo kartta, insight-kortit JA ranking-taulukko`;

export const ANALYST_TOOLS: Anthropic.Tool[] = [
  {
    name: 'query_municipal_data',
    description:
      'Hakee kuntakohtaista tilastodataa Suomen avoimista datalähteistä. Palauttaa tiedot kunnittain. Käytettävissä olevat datasetit: rikostilastot-kunnittain, vakiluku-kunnittain, tyottomyysaste-kunnittain, sairastavuusindeksi-kunnittain.',
    input_schema: {
      type: 'object' as const,
      properties: {
        datasets: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Lista datasettien slug-tunnisteista, esim. ["rikostilastot-kunnittain", "vakiluku-kunnittain"]',
        },
        municipalities: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Valinnainen: rajaa tiettyihin kuntiin kuntakoodilla, esim. ["091", "837", "564"]. Tyhjä = kaikki kunnat.',
        },
        year: {
          type: 'string',
          description:
            'Vuosi, esim. "2023". Oletuksena uusin saatavilla oleva vuosi.',
        },
      },
      required: ['datasets'],
    },
  },
  {
    name: 'create_map_layer',
    description:
      'Luo choropleth-karttatasoon, joka värittää Suomen kunnat laskettujen arvojen perusteella. Karttataso näytetään käyttäjälle interaktiivisena Mapbox-tasona. Anna aina kuntakoodi, laskettu arvo ja selkokielinen label jokaiselle kunnalle.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: {
          type: 'string',
          description: 'Karttatasoon otsikko, esim. "Rikokset per 1000 asukasta"',
        },
        computed_data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kunta_koodi: { type: 'string', description: 'Kuntakoodi, esim. "091"' },
              value: { type: 'number', description: 'Laskettu numeerinen arvo' },
              label: {
                type: 'string',
                description: 'Selkokielinen label, esim. "Helsinki: 45.2 rikosta / 1000 as."',
              },
            },
            required: ['kunta_koodi', 'value', 'label'],
          },
          description: 'Kuntakohtaiset lasketut arvot',
        },
        color_scale: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Väriskaala 5 väriä matalasta korkeaan, esim. ["#2dc653", "#a3d977", "#f5e642", "#f59e42", "#e63946"]',
        },
        label_format: {
          type: 'string',
          description: 'Yksikkö legendaan, esim. "rikosta / 1000 as." tai "%" tai "indeksi"',
        },
      },
      required: ['title', 'computed_data', 'color_scale', 'label_format'],
    },
  },
  {
    name: 'create_insight',
    description:
      'Luo avainlöydös-kortit analyysin tuloksista. Jokainen kortti sisältää otsikon, arvon, kuvauksen ja vakavuustason. Käytä tätä korostamaan tärkeimmät havainnot.',
    input_schema: {
      type: 'object' as const,
      properties: {
        findings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Löydöksen otsikko' },
              value: {
                type: 'string',
                description: 'Avainluku tai -tieto, esim. "12.3 / 1000 as."',
              },
              description: { type: 'string', description: 'Lyhyt selitys' },
              severity: {
                type: 'string',
                enum: ['positive', 'neutral', 'negative', 'info'],
                description: 'Löydöksen sävy',
              },
            },
            required: ['title', 'value', 'description', 'severity'],
          },
          description: '3-5 avainlöydöstä',
        },
        data_sources: {
          type: 'array',
          items: { type: 'string' },
          description: 'Käytetyt datalähteet, esim. ["Tilastokeskus", "THL Sotkanet"]',
        },
      },
      required: ['findings', 'data_sources'],
    },
  },
  {
    name: 'create_table',
    description:
      'Luo ranking-taulukko kuntien vertailuun. Näyttää top/bottom kunnat valitun mittarin mukaan.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Taulukon otsikko' },
        columns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              label: { type: 'string' },
              unit: { type: 'string' },
            },
            required: ['key', 'label'],
          },
          description: 'Sarakkeiden määrittelyt',
        },
        rows: {
          type: 'array',
          items: { type: 'object' },
          description: 'Rivit objekteina, avaimet vastaavat sarakkeiden key-kenttiä',
        },
        sort_by: { type: 'string', description: 'Lajittelusarakkeen key' },
        sort_direction: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Lajittelusuunta',
        },
      },
      required: ['title', 'columns', 'rows'],
    },
  },
];
