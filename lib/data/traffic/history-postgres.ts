/**
 * Event history - PostgreSQL-pohjainen toteutus
 *
 * Korvaa JSON-pohjaisen historian skaalaavilla PostgreSQL-kyselyillä.
 * Ratkaisee file I/O bottleneckin ja race condition -ongelmat.
 */

import { supabase } from '@/lib/db/supabase';
import type { NormalizedEvent } from '@/lib/types';
import type { EventHistoryRow } from '@/lib/db/supabase';

const MAX_HISTORY_DAYS = 30; // Säilytä 30 päivää historiaa
const MAX_EVENTS = 50000; // Maksimi tapahtumamäärä (PostgreSQL kestää paljon enemmän kuin JSON)

/**
 * Päivitä historia uusilla tapahtumilla
 *
 * Logiikka:
 * 1. Etsi olemassa olevat tapahtumat ID:n mukaan
 * 2. Lisää uudet tapahtumat
 * 3. Päivitä olemassa olevat (last_seen, is_active = true)
 * 4. Merkitse puuttuvat tapahtumat ei-aktiivisiksi
 * 5. Siivoa vanhat tapahtumat
 */
export async function updateHistory(events: NormalizedEvent[]): Promise<{
  newEvents: number;
  updatedEvents: number;
  closedEvents: number;
  totalEvents: number;
}> {
  const now = new Date().toISOString();
  const activeIds = events.map(e => e.id);

  try {
    // 1. Hae olemassa olevat tapahtumat (ID:iden mukaan)
    const { data: existingEvents, error: fetchError } = await supabase
      .from('event_history')
      .select('id')
      .in('id', activeIds);

    if (fetchError) throw fetchError;

    const existingIds = new Set((existingEvents || []).map(e => e.id));

    // 2. Erottele uudet ja päivitettävät
    const newEventsList = events.filter(e => !existingIds.has(e.id));
    const updateEventsList = events.filter(e => existingIds.has(e.id));

    let newCount = 0;
    let updatedCount = 0;

    // 3. Lisää uudet tapahtumat
    if (newEventsList.length > 0) {
      const { error: insertError } = await supabase
        .from('event_history')
        .insert(
          newEventsList.map(event => ({
            id: event.id,
            event_type: event.type,
            category: event.category,
            title: event.title,
            description: event.description || null,
            location_coordinates: {
              lat: event.location.coordinates[1],
              lng: event.location.coordinates[0],
            },
            location_name: event.location.name || null,
            municipality: event.location.municipality || null,
            road: event.location.road || null,
            first_seen: now,
            last_seen: now,
            is_active: true,
            severity: event.severity || null,
            source: event.source,
            metadata: event.metadata || null,
          }))
        );

      if (insertError) throw insertError;
      newCount = newEventsList.length;
    }

    // 4. Päivitä olemassa olevat tapahtumat (jokainen erikseen omilla tiedoillaan)
    if (updateEventsList.length > 0) {
      const updatePromises = updateEventsList.map(event =>
        supabase
          .from('event_history')
          .update({
            last_seen: now,
            is_active: true,
            event_type: event.type,
            title: event.title,
            description: event.description || null,
            severity: event.severity || null,
            metadata: event.metadata || null,
          })
          .eq('id', event.id)
      );

      const results = await Promise.all(updatePromises);
      for (const { error: updateError } of results) {
        if (updateError) throw updateError;
      }
      updatedCount = updateEventsList.length;
    }

    // 5. Merkitse puuttuvat tapahtumat ei-aktiivisiksi
    // Hae aktiiviset tapahtumat joita ei ole uusissa tapahtumissa
    let closedCount = 0;
    if (activeIds.length > 0) {
      const { data: inactiveEvents, error: inactiveFetchError } = await supabase
        .from('event_history')
        .select('id')
        .eq('is_active', true)
        .not('id', 'in', `(${activeIds.join(',')})`);

      if (inactiveFetchError) throw inactiveFetchError;

      if (inactiveEvents && inactiveEvents.length > 0) {
        const { error: closeError } = await supabase
          .from('event_history')
          .update({ is_active: false, updated_at: now })
          .in('id', inactiveEvents.map(e => e.id));

        if (closeError) throw closeError;
        closedCount = inactiveEvents.length;
      }
    }

    // 6. Siivoa vanhat tapahtumat (>30 päivää ja ei aktiivisia)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MAX_HISTORY_DAYS);
    const cutoffStr = cutoffDate.toISOString();

    await supabase
      .from('event_history')
      .delete()
      .eq('is_active', false)
      .lt('last_seen', cutoffStr);

    // 7. Hae kokonaistapahtumamäärä
    const { count, error: countError } = await supabase
      .from('event_history')
      .select('*', { count: 'exact', head: true });

    if (countError && countError.code !== 'PGRST116') {
      throw countError;
    }

    return {
      newEvents: newCount,
      updatedEvents: updatedCount,
      closedEvents: closedCount,
      totalEvents: count || 0,
    };
  } catch (error) {
    console.error('PostgreSQL history update failed:', error);
    throw error;
  }
}

/**
 * Hae tapahtumat historiasta aikavälillä
 */
export async function getHistoryEvents(options: {
  startTime?: Date;
  endTime?: Date;
  includeInactive?: boolean;
  categories?: string[];
} = {}): Promise<NormalizedEvent[]> {
  const { startTime, endTime, includeInactive = true, categories } = options;

  try {
    let query = supabase
      .from('event_history')
      .select('*')
      .order('last_seen', { ascending: false });

    // Suodata aktiivisuuden mukaan
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    // Suodata ajan mukaan
    if (startTime) {
      query = query.gte('last_seen', startTime.toISOString());
    }

    if (endTime) {
      query = query.lte('first_seen', endTime.toISOString());
    }

    // Suodata kategorian mukaan
    if (categories && categories.length > 0) {
      query = query.in('category', categories);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Muunna rivit NormalizedEvent-objekteiksi
    return (data || []).map((row: EventHistoryRow) => ({
      id: row.id,
      type: row.event_type as NormalizedEvent['type'],
      category: row.category as NormalizedEvent['category'],
      title: row.title,
      description: row.description || '',
      location: {
        coordinates: [row.location_coordinates.lng, row.location_coordinates.lat] as [number, number],
        name: row.location_name || '',
        municipality: row.municipality || undefined,
        road: row.road || undefined,
      },
      timestamp: new Date(row.first_seen),
      endTime: undefined,
      severity: row.severity as NormalizedEvent['severity'],
      source: row.source,
      metadata: row.metadata || undefined,
    })) as NormalizedEvent[];
  } catch (error) {
    console.error('PostgreSQL history fetch failed:', error);
    throw error;
  }
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
  try {
    // Hae tilastot aggregaatiolla (tehokkaampi kuin JSON)
    const { data: stats, error: statsError } = await supabase
      .from('event_history')
      .select(`
        id,
        is_active,
        category,
        first_seen,
        last_seen
      `)
      .order('first_seen', { ascending: true });

    if (statsError) throw statsError;

    const events = stats || [];
    const categoryCounts: Record<string, number> = {};
    let activeCount = 0;
    let oldest: string | null = null;
    let newest: string | null = null;

    for (const event of events) {
      // Laske kategoriat
      categoryCounts[event.category] = (categoryCounts[event.category] || 0) + 1;

      // Laske aktiiviset
      if (event.is_active) activeCount++;

      // Etsi vanhin ja uusin
      if (!oldest || event.first_seen < oldest) oldest = event.first_seen;
      if (!newest || event.last_seen > newest) newest = event.last_seen;
    }

    return {
      totalEvents: events.length,
      activeEvents: activeCount,
      closedEvents: events.length - activeCount,
      oldestEvent: oldest,
      newestEvent: newest,
      categoryCounts,
    };
  } catch (error) {
    console.error('PostgreSQL stats fetch failed:', error);
    throw error;
  }
}
