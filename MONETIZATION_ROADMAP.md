# Tilannekuva.online - Monetisointisuunnitelma Implementaatio

**Päivämäärä:** 04.02.2026
**Versio:** 1.0
**Strategia:** Tech-First Growth → Hybrid Freemium + B2B API
**Aikajänne:** 12 viikkoa (osa-aikainen 5-10h/viikko)

---

## 🎯 Strategia Tiivistelmä

**Lähestymistapa:** Rakenna alusta + palvelut valmiiksi, käynnistä ilmaisella, lisää maksulliset features myöhemmin

1. **Viikot 1-4 (MVP Monetization):** Auth + User Management + Dashboard
2. **Viikot 5-8 (Growth Focus):** API Architecture + Rate Limiting infrastructure
3. **Viikot 9-12 (Features):** Premium ominaisuudet (alerts, history, exports)
4. **Stripe & B2B:** Scaffolding viikot 5-8, implementaatio viikot 13+

**Nyt:** Fokus ILMAISELLA mallilla, maksimum julkisuus, käyttäjäkasvu
**Myöhemmin (kk 4+):** Lisää premium-palvelut validoidun tarpeen mukaan

---

## 📋 Vaihe 1: MVP Monetization (Viikot 1-4)

### Tavoite
Rakentaa käyttäjähallinto ja dashboard, joka mahdollistaa ilmaisen käytön ja myöhemmän maksuominaisuuksien lisäämisen

### Toimenpiteet

#### Viikko 1-2: Supabase Auth + User Management
**Teknologia:** Supabase (avointa lähdekoodia, ilmainen taso)
**Kustannus:** €0 (ilmainen tier), €25/kk myöhemmin (Pro tier skaalautessa)

**Tiedostot:**
```
lib/auth/
├── supabase-client.ts          # Supabase client initialization
├── auth-context.tsx            # React Context for auth state
├── protected-route.tsx         # Client-side route protection
└── session-manager.ts          # Session management & token refresh

app/auth/
├── login/page.tsx              # Login sivu
├── signup/page.tsx             # Signup sivu
├── callback/route.ts           # OAuth callback (tulevaisuus)
└── logout/route.ts             # Logout endpoint

supabase/
├── migrations/
│   └── 001_create_profiles.sql # User profiles table
└── seed.sql                    # Test data (optional)
```

**Tietokanta (Supabase PostgreSQL):**
```sql
-- profiles taulukko
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free', -- free, premium, pro
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- api_keys taulukko (myöhemmin)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  key TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- user_alerts taulukko (myöhemmin)
CREATE TABLE user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT, -- crime, traffic, weather
  region GEOMETRY(POLYGON, 4326),
  enabled BOOLEAN DEFAULT true,
  notification_method TEXT, -- email, push, webhook
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Implementaatio (pseudokoodi):**
```typescript
// lib/auth/supabase-client.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// lib/auth/auth-context.tsx
'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from './supabase-client'

interface AuthContextType {
  user: User | null
  profile: any | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// app/auth/signup/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const { signUp } = useAuth()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signUp(email, password)
      // Email verification ongelma: Supabase lähettää confirmationemail
      // Tässä vaiheessa käyttäjä voidaan ohjata login-sivulle tai redirect
      router.push('/auth/login?message=Check+your+email+for+confirmation')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-md p-8 bg-slate-800 rounded-lg">
        <h1 className="text-2xl font-bold text-white mb-6">Rekisteröidy</h1>

        <form onSubmit={handleSignUp} className="space-y-4">
          <input
            type="email"
            placeholder="Sähköposti"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 text-white rounded"
            required
          />

          <input
            type="password"
            placeholder="Salasana"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 text-white rounded"
            required
          />

          <button
            type="submit"
            className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded font-semibold"
          >
            Rekisteröidy
          </button>
        </form>

        {error && <p className="text-red-400 mt-4">{error}</p>}
      </div>
    </div>
  )
}
```

**Arvioidut tunnit:** 40-50h

---

#### Viikko 3-4: User Dashboard + Profile Management
**Tavoite:** Käyttäjä voi hallita profiiliaan ja nähdä käyttöstatistiikkaa

**Tiedostot:**
```
app/dashboard/
├── page.tsx                    # Dashboard etusivu (overview)
├── profile/page.tsx            # Profiilin muokkaus
├── settings/page.tsx           # Asetukset
└── api-keys/page.tsx           # API-avainten hallinta (myöhemmin)

components/dashboard/
├── DashboardHeader.tsx
├── StatsCard.tsx
├── ProfileForm.tsx
└── NotificationPreferences.tsx
```

**Dashboard Komponentit (pseudokoodi):**
```typescript
// app/dashboard/page.tsx
'use client'
import { useAuth } from '@/lib/auth/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading])

  if (loading) return <div>Ladataan...</div>

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="bg-slate-800 p-6 border-b border-slate-700">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">Tervetuloa, {profile?.full_name || profile?.username}!</h1>
          <p className="text-slate-400">Tilannekuva.online Dashboard</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Stats Cards */}
          <StatsCard
            title="Käyttötunnit kuussa"
            value="23h 45min"
            icon="⏱️"
          />
          <StatsCard
            title="Hälytykset (Premium)"
            value="0 / 5"
            icon="🔔"
          />
          <StatsCard
            title="Tilaus"
            value={profile?.subscription_tier === 'free' ? 'Ilmainen' : 'Premium'}
            icon="💳"
          />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Profiilin Asetukset</h2>
            <p className="text-slate-400 mb-4">Hallitse profiili ja mieltymyksiäsi</p>
            <a href="/dashboard/profile" className="text-cyan-400 hover:text-cyan-300">
              Siirry asetuksiin →
            </a>
          </div>

          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">API-avaimet</h2>
            <p className="text-slate-400 mb-4">Luo ja hallitse API-avaimia (tulossa)</p>
            <span className="text-slate-500">Saatavilla Premium-tilauksen kanssa</span>
          </div>
        </div>
      </main>
    </div>
  )
}

// components/dashboard/StatsCard.tsx
interface StatsCardProps {
  title: string
  value: string
  icon: string
}

export function StatsCard({ title, value, icon }: StatsCardProps) {
  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-2">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  )
}
```

**Arvioidut tunnit:** 30-40h

---

### Vaihe 1 Yhteenveto

| Osio | Tunnit | Tulos |
|------|--------|-------|
| Auth + User Mgmt | 40-50h | Supabase integration, signup/login |
| Dashboard | 30-40h | User portal, profile management |
| **YHTEENSÄ** | **70-90h** | **Ilmainen käyttäjärekisteröinti ready** |

**Kehityskustannukset:** €0 (Supabase ilmainen, omat tunnit)
**SaaS-kustannukset:** €0/kk (ilmainen taso kunnes >100K käyttäjää)

---

## 📋 Vaihe 2: API Architecture + Growth Infrastructure (Viikot 5-8)

### Tavoite
Rakentaa API ja rate limiting -infra, joka mahdollistaa maksullisten API-tasojen tulevaisuuden

### Viikko 5-6: API-avainten Hallinta + Rate Limiting Foundation

**Teknologia:** Upstash Redis (ilmainen taso), API keys in Supabase

**Tiedostot:**
```
lib/api-keys/
├── generate-key.ts             # Luo uusia API-avaimia
├── validate-key.ts             # Validoi API-avain pyynnöissä
└── format-key.ts               # Formaatti: tk_live_xxxxx

lib/rate-limit/
├── upstash-client.ts           # Upstash Redis client
├── rate-limiter.ts             # Rate limiting logic
└── types.ts                    # Rate limit tyypit

app/api/middleware.ts           # Global middleware for auth + rate limiting
app/dashboard/api-keys/page.tsx # UI for API key management
```

**Implementaatio (pseudokoodi):**
```typescript
// lib/api-keys/generate-key.ts
import { supabase } from '@/lib/auth/supabase-client'

export async function generateApiKey(userId: string, name: string) {
  // Format: tk_live_xxxxx (or tk_test_xxxxx)
  const key = `tk_live_${generateRandomString(32)}`

  const { error } = await supabase
    .from('api_keys')
    .insert({
      user_id: userId,
      key: key,
      name: name,
      is_active: true
    })

  if (error) throw error
  return key
}

// lib/rate-limit/upstash-client.ts
import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

export interface RateLimitConfig {
  requests: number      // max requests
  window: number       // time window in seconds
}

export const rateLimitConfigs: Record<string, RateLimitConfig> = {
  free: { requests: 60, window: 3600 },           // 60/h
  premium: { requests: 120, window: 3600 },       // 120/h
  pro: { requests: 500, window: 3600 },           // 500/h
  business: { requests: 2000, window: 3600 },     // 2000/h
}

// lib/rate-limit/rate-limiter.ts
import { redis, rateLimitConfigs, RateLimitConfig } from './upstash-client'

export async function checkRateLimit(
  userId: string,
  tier: string
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const config = rateLimitConfigs[tier] || rateLimitConfigs.free
  const key = `ratelimit:${userId}:${Math.floor(Date.now() / 1000 / config.window)}`

  const count = await redis.incr(key)

  if (count === 1) {
    await redis.expire(key, config.window)
  }

  const allowed = count <= config.requests
  const remaining = Math.max(0, config.requests - count)
  const resetAt = Math.floor((await redis.ttl(key)) * 1000)

  return { allowed, remaining, resetAt }
}

// app/api/middleware.ts (käyttää Next.js middleware)
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/auth/supabase-client'
import { checkRateLimit } from '@/lib/rate-limit/rate-limiter'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Only for /api/v1/* endpoints
  if (!path.startsWith('/api/v1/')) {
    return NextResponse.next()
  }

  // Get API key from header
  const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing API key' },
      { status: 401 }
    )
  }

  // Validate API key
  const { data: key } = await supabase
    .from('api_keys')
    .select('user_id')
    .eq('key', apiKey)
    .single()

  if (!key) {
    return NextResponse.json(
      { error: 'Invalid API key' },
      { status: 401 }
    )
  }

  // Get user tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', key.user_id)
    .single()

  // Check rate limit
  const limit = await checkRateLimit(key.user_id, profile?.subscription_tier || 'free')

  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: {
        'X-RateLimit-Reset': limit.resetAt.toString()
      }}
    )
  }

  // Add user context to request
  const response = NextResponse.next()
  response.headers.set('X-User-Id', key.user_id)
  response.headers.set('X-RateLimit-Remaining', limit.remaining.toString())
  response.headers.set('X-RateLimit-Reset', limit.resetAt.toString())

  return response
}

export const config = {
  matcher: ['/api/v1/:path*']
}
```

**API Endpoints Structure:**
```
app/api/v1/
├── events/
│   ├── route.ts               # GET /api/v1/events (current)
│   ├── history/route.ts       # GET /api/v1/events/history (Premium)
│   └── search/route.ts        # POST /api/v1/events/search (Premium+)
├── alerts/
│   ├── route.ts               # GET/POST /api/v1/alerts
│   └── [id]/route.ts          # PUT/DELETE /api/v1/alerts/[id]
├── exports/
│   ├── csv/route.ts           # POST /api/v1/exports/csv (Premium)
│   ├── pdf/route.ts           # POST /api/v1/exports/pdf (Premium)
│   └── geojson/route.ts       # POST /api/v1/exports/geojson
└── usage/
    └── route.ts               # GET /api/v1/usage (API usage stats)
```

**Arvioidut tunnit:** 40-50h

---

### Viikko 7-8: API Documentation + SDK Stubs

**Dokumentaatio:**
```
docs/api/
├── index.md                   # API overview
├── authentication.md          # Auth guide
├── rate-limiting.md           # Rate limit explanation
├── endpoints.md               # Endpoint reference
├── examples.md                # Code examples (cURL, TS, Python)
└── sdks.md                    # SDK stubs (tulevaisuus)

app/api-docs/page.tsx          # Interactive API docs
```

**Arvioidut tunnit:** 20-30h

---

### Vaihe 2 Yhteenveto

| Osio | Tunnit | Tulos |
|------|--------|-------|
| API Key Mgmt + Rate Limiting | 40-50h | Infrastructure ready for paid tiers |
| API Documentation | 20-30h | Developer-ready docs |
| **YHTEENSÄ** | **60-80h** | **API monetisatio-ready** |

**Kehityskustannukset:** €0 (Upstash ilmainen taso)
**SaaS-kustannukset:** €0/kk (Upstash ilmainen, Supabase ilmainen)

---

## 📋 Vaihe 3: Premium Features Skeleton (Viikot 9-12)

### Tavoite
Rakentaa premium-feature infrastruktuuri (Alerts, History, Exports) - ei vielä käytössä, mutta ready deployment

### Viikko 9: User Alerts System

**Tiedostot:**
```
lib/alerts/
├── create-alert.ts
├── fetch-alerts.ts
├── check-alerts.ts           # Background job (myöhemmin: cron)
├── notification-service.ts   # Email/webhook/push

app/dashboard/alerts/page.tsx # Alert management UI
```

**Pseudokoodi:**
```typescript
// lib/alerts/create-alert.ts
import { supabase } from '@/lib/auth/supabase-client'
import { GeoJSON } from 'geojson'

export interface UserAlert {
  id: string
  user_id: string
  name: string
  category: 'crime' | 'traffic' | 'weather'
  region: GeoJSON
  enabled: boolean
  notification_method: 'email' | 'push' | 'webhook'
  webhook_url?: string
  created_at: string
}

export async function createAlert(
  userId: string,
  alert: Omit<UserAlert, 'id' | 'created_at' | 'user_id'>
): Promise<UserAlert> {
  const { data, error } = await supabase
    .from('user_alerts')
    .insert({
      user_id: userId,
      ...alert
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Vaihe myöhemmin: Background job joka checkaa alerts
// ja lähettää notifikaatioita
```

**Arvioidut tunnit:** 30-40h

---

### Viikko 10: Historical Data API

**Tiedostot:**
```
lib/data/history/
├── store-snapshots.ts        # Store snapshot data (daily cron)
├── query-history.ts          # Query historical data

app/api/v1/events/history/route.ts  # /api/v1/events/history
```

**Implementaatio:**
```typescript
// lib/data/history/store-snapshots.ts
// Tämä on background job (tulevaisuus: scheduled cron)
// Jokainen yö: snapshottaa kaikki tämän päivän data
// Säilyttää 30 päivää, sitten poistetaan

// lib/data/history/query-history.ts
export async function queryHistoricalEvents(
  category: string,
  startDate: Date,
  endDate: Date,
  bounds?: GeoJSON
): Promise<any[]> {
  // Query data storage (tässä vaiheessa: mock data)
  // Tulevaisuus: real database
}
```

**Arvioidut tunnit:** 20-30h

---

### Viikko 11-12: Export Features + Admin Dashboard

**Export Features:**
```typescript
// lib/exports/csv-export.ts
export async function exportToCSV(events: Event[]): Promise<Blob> {
  const csv = events.map(e =>
    `${e.id},${e.category},${e.title},${e.latitude},${e.longitude}`
  ).join('\n')

  return new Blob([csv], { type: 'text/csv' })
}

// lib/exports/pdf-export.ts (käyttää simple-pdf-lib)
export async function exportToPDF(events: Event[]): Promise<Blob> {
  // Generate PDF report
  // Includes map screenshot, statistics, etc.
}
```

**Admin Dashboard:**
```
app/admin/
├── page.tsx                   # Dashboard overview
├── users/page.tsx             # User management
├── analytics/page.tsx         # Usage analytics
└── api-usage/page.tsx         # API usage stats
```

**Arvioidut tunnit:** 40-50h

---

### Vaihe 3 Yhteenveto

| Osio | Tunnit | Tulos |
|------|--------|-------|
| Alerts System | 30-40h | Infrastructure ready |
| Historical Data | 20-30h | Query infrastructure ready |
| Export Features | 30-40h | Export scaffolding ready |
| Admin Dashboard | 40-50h | Analytics & monitoring |
| **YHTEENSÄ** | **120-160h** | **Premium features ready for deployment** |

---

## 🎯 Kokonaissuunnitelma

### Tunnit Yhteensä
```
Vaihe 1: MVP Monetization     70-90h    (Viikot 1-4)
Vaihe 2: API Architecture     60-80h    (Viikot 5-8)
Vaihe 3: Premium Features    120-160h   (Viikot 9-12)
───────────────────────────────────────
YHTEENSÄ                     250-330h   (~12 viikkoa @ 5-10h/viikko)
```

### Kustannukset Vuosi 1

**Kehityskustannukset (kertaluonteinen):** €0 (omat tunnit)

**Kuukausikulut (loppuvuosi):**
```
Supabase (Pro)           €25/kk   (myöhemmin, skaalautuessa)
Upstash Redis            €10/kk   (myöhemmin, maksullinen)
Vercel (Premium)         €20/kk   (tarvitaan env vars)
────────────────────────────────
Yhteensä infra:          €55/kk
```

### Markkinointi & Growth

**Ensivaihe (ilmainen):**
- Reddit r/Finland, r/Helsinki
- Suomalaiset tech-blogit (Tivi, Digitoday)
- GitHub trending
- Product Hunt (tulevaisuus)
- Twitter/X tech community

**Myöhemmin (budget):**
- LinkedIn Ads (B2B focus)
- Google Ads (branded keywords)
- Sponsorointisopimukset tech-eventseissa

---

## 📊 Success Metrics

### Kasvumetriikat
- DAU (Daily Active Users) tavoite: 1,000 kk 1 → 10,000 kk 12
- WAU (Weekly Active Users): >20% DAU
- Käyttäjän sessionin kesto: >3 minuuttia
- Paluu freq: >40% viikoittain

### Sitoutumismetriikat
- Rekisteröitymisen jälkeen aktiivaatio: >30%
- Ominaisuuksien käyttö: >50% (mitkä kerrokset, exportit, alerts)
- Feature adoption: >20% premium-ominaisuuksille (kun ne valmis)

### Realistis- ja Varovaisuusmetriikat (Vuosi 1)
- **Breakeven MRR tavoite:** €6,400 (kk 12)
- **Konversio free→paid:** 2-5% (realistinen)
- **API-asiakkaat:** 5-10 kk 12 mennessä

---

## 🚀 Seuraavat Vaiheet TÄMÄN JÄLKEEN (Kk 13+)

1. **Stripe Integration** (3-4 viikkoa)
   - Checkout implementation
   - Webhook handling
   - Customer portal

2. **B2B Sales** (jatkuva)
   - Direct outreach 50 kohdeyritykselle
   - Free 30-day trials
   - Case studies

3. **White-label** (4-6 viikkoa)
   - White-label API offering
   - Custom branding
   - Enterprise support

4. **Laajentaminen muihin maihin** (3-6 kuukautta)
   - Ruotsi: Trafikverket data
   - Norja: Vegvesen data
   - Tanska: vejdirektoratet data

---

## ⚠️ Kriittiset Huomiot

### 1. Ilmainen Malli on KRIITTINEN
- Fokus KASVUUN ensin, monetisointiin myöhemmin
- Kuten Spotify, Instagram, Twitter aloittivat
- Maksuominaisuudet voidaan lisätä vaivattomasti myöhemmin
- Älä laske paywall liian aikaisin

### 2. API on Tulevaisuuden Liikevaihto
- B2B > B2C maksuhalukkuus
- Logistiikka, media, hätäpalvelut valmiit maksaa
- Fokus API:n laadusta ja reliability:sta

### 3. Data Pysyy Ilmaisena
- Ei tarvitse maksaa datalähteiden käytöstä
- Kestävä kustannusrakenne
- Kilpailuetu verrattuna muihin palveluihin

### 4. Tech Stack on Scalable
- Vercel handles traffic spikes
- Supabase scales automatically
- Redis caching for performance
- No single point of failure

---

## 📝 Implementation Checklist

### Vaihe 1 (Viikot 1-4)
- [ ] Supabase setup (project + database)
- [ ] Auth implementation (signup/login)
- [ ] Dashboard scaffolding
- [ ] Profile management UI
- [ ] Test with beta users (10-20)
- [ ] Bug fixes ja refinement

### Vaihe 2 (Viikot 5-8)
- [ ] API key generation + management
- [ ] Rate limiting infrastructure
- [ ] Middleware implementation
- [ ] API documentation
- [ ] Rate limit testing
- [ ] Load testing

### Vaihe 3 (Viikot 9-12)
- [ ] Alerts system backend
- [ ] Historical data storage preparation
- [ ] Export features scaffolding
- [ ] Admin dashboard
- [ ] Comprehensive testing
- [ ] Performance optimization

### Post-Launch (Kk 13+)
- [ ] Stripe integration
- [ ] Beta B2B sales
- [ ] Feature based on user feedback
- [ ] Performance monitoring
- [ ] Security audit

---

## 🎉 Lopputulos

**Kk 4 (Huhtikuu 2026):**
- ✅ Ilmainen kartta sovellus live
- ✅ Käyttäjärekisteröinti ja dashboard
- ✅ Aktiivinen käyttäjäpohja (1,000+)
- ✅ API infrastructure valmis
- ✅ Premium-features valmiita deployment

**Kk 12 (Joulukuu 2026):**
- ✅ 10,000+ aktiivista käyttäjää
- ✅ Stripe maksut live
- ✅ 5-10 B2B asiakasta
- ✅ €500-1,000 MRR
- ✅ Realistinen polku breakeven:iin

---

**Valmis implementaatioon:** Kyllä
**Riskitaso:** Matala (validoitu markkina, tekninen expertise olemassa)
**Seuraava askel:** Aloita Vaihe 1 (Supabase setup)
