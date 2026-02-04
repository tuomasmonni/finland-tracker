/**
 * Supabase Database Client
 * PostgreSQL connection pooling & type safety
 */

import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// FAIL-SAFE: Älä kaada buildia jos env-muuttujat puuttuvat
if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '⚠️  Supabase disabled: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

// Create Supabase client (null if not configured)
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Export for use in server functions
export { supabase };

/**
 * Server-side Supabase client with service role (admin)
 * Use this for backend operations that bypass RLS
 */
export function createAdminClient() {
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!adminKey || !supabaseUrl) {
    console.warn('⚠️  Admin client disabled: Missing credentials');
    return null;
  }
  return createClient(supabaseUrl, adminKey);
}

/**
 * Type definitions for event history table
 */
export interface EventHistoryRow {
  id: string;
  event_type: string;
  category: string;
  title: string;
  description: string | null;
  location_coordinates: { lat: number; lng: number };
  location_name: string | null;
  municipality: string | null;
  road: string | null;
  first_seen: string; // ISO timestamp
  last_seen: string;  // ISO timestamp
  is_active: boolean;
  severity: string | null;
  source: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}
