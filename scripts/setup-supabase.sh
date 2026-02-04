#!/bin/bash

# Supabase Schema Setup Script
# Käytä tätä skriptiä SQL-scheman luomiseen Supabase:ssa

set -e

echo "🚀 Supabase Setup Instructions"
echo "================================"
echo ""
echo "1. Mene: https://app.supabase.com"
echo "2. Valitse projekti: tilannekuva-online"
echo "3. Navigoi: SQL Editor (vasemmalla)"
echo "4. Klikkaa: + New Query"
echo "5. Copy-paste tämä SQL:"
echo ""
echo "════════════════════════════════════════════"
cat << 'EOF'

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

EOF
echo "════════════════════════════════════════════"
echo ""
echo "6. Klikkaa: Run (oikea yläkulma)"
echo "7. Varmista: Ei virheitä (vihreä vinkki)"
echo ""
echo "✅ Valmis!"
