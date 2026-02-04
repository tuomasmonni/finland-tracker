/**
 * Supabase Integration Test
 * Testaa että Supabase-yhteys toimii
 */

const fs = require('fs');
const path = require('path');

// Lue .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

const getEnvValue = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
  if (!match) {
    throw new Error(`Missing ${key} in .env.local`);
  }
  return match[1].trim();
};

const SUPABASE_URL = getEnvValue('NEXT_PUBLIC_SUPABASE_URL');
const ANON_KEY = getEnvValue('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const SERVICE_ROLE_KEY = getEnvValue('SUPABASE_SERVICE_ROLE_KEY');

console.log('\n🧪 Supabase Integration Test\n');
console.log('════════════════════════════════════════');
console.log('📍 Configuration Check\n');
console.log(`✅ SUPABASE_URL: ${SUPABASE_URL}`);
console.log(`✅ ANON_KEY: ${ANON_KEY.substring(0, 30)}...`);
console.log(`✅ SERVICE_ROLE_KEY: ${SERVICE_ROLE_KEY.substring(0, 30)}...`);
console.log('\n════════════════════════════════════════');

// Testaa REST API connection
console.log('\n🌐 Testing REST API Connection\n');

async function testAPI() {
  try {
    // Testaa health endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        apikey: ANON_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('✅ REST API Connection: OK');
    } else {
      console.log(`⚠️  REST API Status: ${response.status}`);
    }

    // Testaa event_history taulun olemassaolo
    console.log('\n🔍 Checking event_history Table\n');

    const tableResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/event_history?limit=1`,
      {
        headers: {
          apikey: ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (tableResponse.ok) {
      const data = await tableResponse.json();
      console.log('✅ Table event_history: EXISTS');
      console.log(`   Current rows: ${data.length || 0}`);
    } else if (tableResponse.status === 404) {
      console.log('❌ Table event_history: NOT FOUND');
      console.log('\n   ⚠️  You need to create the table in Supabase SQL Editor');
      console.log('   Run: scripts/setup-supabase.sh');
      return false;
    } else {
      console.log(`⚠️  Table check status: ${tableResponse.status}`);
    }

    // Testaa insert (test event)
    console.log('\n📝 Testing Insert\n');

    const testEvent = {
      id: `test-${Date.now()}`,
      event_type: 'traffic',
      category: 'accident',
      title: 'Test Event',
      description: 'Supabase integration test',
      location_coordinates: { lat: 60.1699, lng: 24.9384 },
      location_name: 'Helsinki',
      municipality: 'Helsinki',
      road: 'Test Road',
      is_active: true,
      severity: 'high',
      source: 'test',
      metadata: { test: true },
    };

    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/event_history`, {
      method: 'POST',
      headers: {
        apikey: ANON_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(testEvent),
    });

    if (insertResponse.ok) {
      const inserted = await insertResponse.json();
      console.log('✅ Insert Test: SUCCESS');
      console.log(`   ID: ${inserted[0]?.id || testEvent.id}`);
      console.log(`   Title: ${inserted[0]?.title || testEvent.title}`);

      // Poista test event
      console.log('\n🗑️  Cleaning up test data...\n');
      await fetch(
        `${SUPABASE_URL}/rest/v1/event_history?id=eq.${testEvent.id}`,
        {
          method: 'DELETE',
          headers: {
            apikey: ANON_KEY,
          },
        }
      );

      console.log('✅ Cleanup: OK\n');
    } else {
      const error = await insertResponse.text();
      console.log(`❌ Insert Test: FAILED (${insertResponse.status})`);
      console.log(`   Error: ${error.substring(0, 100)}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

testAPI().then((success) => {
  console.log('════════════════════════════════════════');
  if (success) {
    console.log('\n✅ All Tests Passed!\n');
    console.log('📊 Next Steps:');
    console.log('   1. npm run dev');
    console.log('   2. curl http://localhost:3000/api/traffic | jq .');
    console.log('   3. Check Supabase Table Editor for new rows\n');
  } else {
    console.log('\n❌ Some tests failed. See instructions above.\n');
    process.exit(1);
  }
});
