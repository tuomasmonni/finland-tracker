/**
 * Historian tallennus - väliaikainen JSON-pohjainen ratkaisu
 *
 * TODO: Vaihda Supabase-integraatioon myöhemmin
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { NormalizedEvent } from '@/lib/types';

const HISTORY_FILE = path.join(process.cwd(), 'data', 'event-history.json');
const MAX_HISTORY_DAYS = 30; // Säilytä 30 päivää historiaa
const MAX_EVENTS = 10000; // Maksimi tapahtumamäärä

interface HistoryEntry {
  id: string;
  event: NormalizedEvent;
  firstSeen: string; // ISO timestamp
  lastSeen: string;  // ISO timestamp
  isActive: boolean;
}

interface HistoryData {
  version: number;
  lastUpdated: string;
  events: Record<string, HistoryEntry>;
}

/**
 * Lue historia tiedostosta
 */
async function readHistory(): Promise<HistoryData> {
  try {
    const data = await fs.readFile(HISTORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    // Tiedostoa ei ole, palauta tyhjä historia
    return {
      version: 1,
      lastUpdated: new Date().toISOString(),
      events: {},
    };
  }
}

/**
 * Tallenna historia tiedostoon
 */
async function writeHistory(data: HistoryData): Promise<void> {
  // Varmista että data-kansio on olemassa
  const dataDir = path.dirname(HISTORY_FILE);
  await fs.mkdir(dataDir, { recursive: true });

  await fs.writeFile(HISTORY_FILE, JSON.stringify(data, null, 2));
}

/**
 * Päivitä historia uusilla tapahtumilla
 */
export async function updateHistory(events: NormalizedEvent[]): Promise<{
  newEvents: number;
  updatedEvents: number;
  closedEvents: number;
  totalEvents: number;
}> {
  const history = await readHistory();
  const now = new Date().toISOString();
  const activeIds = new Set(events.map(e => e.id));

  let newEvents = 0;
  let updatedEvents = 0;
  let closedEvents = 0;

  // Päivitä tai lisää tapahtumat
  for (const event of events) {
    if (history.events[event.id]) {
      // Päivitä olemassa oleva
      history.events[event.id].lastSeen = now;
      history.events[event.id].event = event;
      history.events[event.id].isActive = true;
      updatedEvents++;
    } else {
      // Lisää uusi
      history.events[event.id] = {
        id: event.id,
        event,
        firstSeen: now,
        lastSeen: now,
        isActive: true,
      };
      newEvents++;
    }
  }

  // Merkitse päättyneet tapahtumat
  for (const id of Object.keys(history.events)) {
    if (!activeIds.has(id) && history.events[id].isActive) {
      history.events[id].isActive = false;
      closedEvents++;
    }
  }

  // Siivoa vanhat tapahtumat
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MAX_HISTORY_DAYS);
  const cutoffStr = cutoffDate.toISOString();

  for (const [id, entry] of Object.entries(history.events)) {
    if (!entry.isActive && entry.lastSeen < cutoffStr) {
      delete history.events[id];
    }
  }

  // Rajoita maksimimäärä
  const eventIds = Object.keys(history.events);
  if (eventIds.length > MAX_EVENTS) {
    // Poista vanhimmat ei-aktiiviset
    const sorted = eventIds
      .filter(id => !history.events[id].isActive)
      .sort((a, b) => history.events[a].lastSeen.localeCompare(history.events[b].lastSeen));

    const toRemove = sorted.slice(0, eventIds.length - MAX_EVENTS);
    toRemove.forEach(id => delete history.events[id]);
  }

  // Tallenna
  history.lastUpdated = now;
  await writeHistory(history);

  return {
    newEvents,
    updatedEvents,
    closedEvents,
    totalEvents: Object.keys(history.events).length,
  };
}

/**
 * Hae tapahtumat historiasta aikavälillä
 */
export async function getHistoryEvents(options: {
  startTime?: Date;
  endTime?: Date;
  includeInactive?: boolean;
  categories?: string[];
}): Promise<NormalizedEvent[]> {
  const history = await readHistory();
  const { startTime, endTime, includeInactive = true, categories } = options;

  let events = Object.values(history.events);

  // Suodata aktiivisuuden mukaan
  if (!includeInactive) {
    events = events.filter(e => e.isActive);
  }

  // Suodata ajan mukaan
  if (startTime) {
    const startStr = startTime.toISOString();
    events = events.filter(e => e.lastSeen >= startStr);
  }

  if (endTime) {
    const endStr = endTime.toISOString();
    events = events.filter(e => e.firstSeen <= endStr);
  }

  // Suodata kategorian mukaan
  if (categories && categories.length > 0) {
    events = events.filter(e => categories.includes(e.event.category));
  }

  // Palauta tapahtumat ja konvertoi timestamp stringit Date-objekteiksi
  return events.map(e => ({
    ...e.event,
    timestamp: new Date(e.event.timestamp),
    endTime: e.event.endTime ? new Date(e.event.endTime) : undefined,
  }));
}

/**
 * Hae historian tilastot
 */
export async function getHistoryStats(): Promise<{
  totalEvents: number;
  activeEvents: number;
  closedEvents: number;
  oldestEvent: string | null;
  newestEvent: string | null;
  categoryCounts: Record<string, number>;
}> {
  const history = await readHistory();
  const events = Object.values(history.events);

  const categoryCounts: Record<string, number> = {};
  let oldest: string | null = null;
  let newest: string | null = null;
  let activeCount = 0;

  for (const entry of events) {
    // Laske kategoriat
    const cat = entry.event.category;
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

    // Laske aktiiviset
    if (entry.isActive) activeCount++;

    // Etsi vanhin ja uusin
    if (!oldest || entry.firstSeen < oldest) oldest = entry.firstSeen;
    if (!newest || entry.lastSeen > newest) newest = entry.lastSeen;
  }

  return {
    totalEvents: events.length,
    activeEvents: activeCount,
    closedEvents: events.length - activeCount,
    oldestEvent: oldest,
    newestEvent: newest,
    categoryCounts,
  };
}
