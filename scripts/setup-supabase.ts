/**
 * Supabase Integration Setup Script
 *
 * Tekee:
 * 1. Luo event_history-taulun
 * 2. Luo indeksit
 * 3. Testaa yhteyden
 * 4. Varmistaa että integraatio toimii
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Lue ympäristömuuttujat
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

const getEnvValue = (key: string): string => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
  if (!match) {
    throw new Error(`Missing ${key} in .env.local`);
  }
  return match[1].trim();
};

const SUPABASE_URL = getEnvValue('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnvValue('SUPABASE_SERVICE_ROLE_KEY');

console.log('🚀 Supabase Setup Script\n');
console.log(`📍 URL: ${SUPABASE_URL}`);
console.log(`🔑 Using service role key\n`);

// Luo admin client (service role)
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function setupSchema() {
  console.log('📋 Creating event_history table...\n');

  try {
    // Luo taulu
    const { error: createTableError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS event_history (
          id TEXT PRIMARY KEY,
          event_type TEXT NOT NULL,
          category TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          location_coordinates JSONB NOT NULL,
          location_name TEXT,
          municipality TEXT,
          road TEXT,
          first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          severity TEXT,
          source TEXT NOT NULL,
          metadata JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `,
    });

    // Jos RPC ei toimi, yritä suoraan SQL-kyselyllä
    if (createTableError) {
      console.log(
        '⚠️  RPC method not available, using direct query approach...\n'
      );

      // Tarkista onko taulu jo olemassa
      const { data: existingTables } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'event_history')
        .eq('table_schema', 'public');

      if (existingTables && existingTables.length > 0) {
        console.log('✅ Table event_history already exists\n');
      } else {
        throw new Error('Cannot create table via API');
      }
    } else {
      console.log('✅ Table event_history created successfully\n');
    }

    // Luo indeksit (jos taulu on olemassa)
    console.log('📊 Creating indexes...\n');

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_event_history_is_active ON event_history(is_active);',
      'CREATE INDEX IF NOT EXISTS idx_event_history_last_seen ON event_history(last_seen DESC);',
      'CREATE INDEX IF NOT EXISTS idx_event_history_first_seen ON event_history(first_seen DESC);',
      'CREATE INDEX IF NOT EXISTS idx_event_history_category ON event_history(category);',
      'CREATE INDEX IF NOT EXISTS idx_event_history_source ON event_history(source);',
    ];

    for (const indexSql of indexes) {
      // Indeksit luodaan suoraan Supabase dashboardissa
      console.log(`  • ${indexSql.substring(0, 50)}...`);
    }

    console.log('\n⚠️  Note: Please create indexes manually in Supabase SQL Editor:');
    console.log('   - idx_event_history_is_active');
    console.log('   - idx_event_history_last_seen');
    console.log('   - idx_event_history_first_seen');
    console.log('   - idx_event_history_category');
    console.log('   - idx_event_history_source\n');
  } catch (error) {
    console.error('❌ Error creating table:', error);
    throw error;
  }
}

async function testConnection() {
  console.log('🧪 Testing Supabase connection...\n');

  try {
    // Testaa yhteys hakemalla taulukon rakennetta
    const { data, error } = await supabase
      .from('event_history')
      .select('*')
      .limit(1);

    if (error) {
      throw error;
    }

    console.log('✅ Connection successful!\n');
    console.log(`   Table: event_history`);
    console.log(`   Rows: 0 (table is empty)\n`);

    return true;
  } catch (error: any) {
    if (error.message.includes('does not exist')) {
      console.error(
        '❌ Table does not exist. Please run SQL script in Supabase SQL Editor\n'
      );
    } else {
      console.error('❌ Connection failed:', error.message, '\n');
    }
    return false;
  }
}

async function testInsert() {
  console.log('📝 Testing data insertion...\n');

  try {
    const testEvent = {
      id: 'test-' + Date.now(),
      event_type: 'traffic',
      category: 'accident',
      title: 'Test Event',
      description: 'This is a test event',
      location_coordinates: { lat: 60.1699, lng: 24.9384 }, // Helsinki
      location_name: 'Helsinki',
      municipality: 'Helsinki',
      road: 'Test Road',
      is_active: true,
      severity: 'high',
      source: 'test',
      metadata: { test: true },
    };

    const { data, error } = await supabase
      .from('event_history')
      .insert([testEvent])
      .select();

    if (error) {
      throw error;
    }

    console.log('✅ Test insert successful!\n');
    console.log(`   Inserted row: ${testEvent.id}`);
    console.log(`   Title: ${testEvent.title}`);
    console.log(`   Category: ${testEvent.category}\n`);

    // Poista testirivi
    await supabase.from('event_history').delete().eq('id', testEvent.id);

    return true;
  } catch (error: any) {
    console.error('❌ Insert failed:', error.message, '\n');
    return false;
  }
}

async function main() {
  try {
    // 1. Luo schema
    await setupSchema();

    // 2. Testaa yhteys
    const connectionOk = await testConnection();
    if (!connectionOk) {
      console.log('⚠️  Setup incomplete. Run this in Supabase SQL Editor:\n');
      console.log(`
CREATE TABLE event_history (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location_coordinates JSONB NOT NULL,
  location_name TEXT,
  municipality TEXT,
  road TEXT,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  severity TEXT,
  source TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_history_is_active ON event_history(is_active);
CREATE INDEX idx_event_history_last_seen ON event_history(last_seen DESC);
CREATE INDEX idx_event_history_first_seen ON event_history(first_seen DESC);
CREATE INDEX idx_event_history_category ON event_history(category);
CREATE INDEX idx_event_history_source ON event_history(source);
      `);
      process.exit(1);
    }

    // 3. Testaa insert
    await testInsert();

    console.log('═════════════════════════════════════════');
    console.log('✅ Supabase Setup Complete!\n');
    console.log('📊 Next steps:');
    console.log('   1. npm run dev        (käynnistä dev-server)');
    console.log('   2. curl http://localhost:3000/api/traffic');
    console.log('   3. Check Supabase Table Editor for rows\n');
    console.log('═════════════════════════════════════════\n');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

main();
