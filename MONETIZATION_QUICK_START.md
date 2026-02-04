# Tilannekuva.online Monetisaatio - Quick Start Guide

**Aloitus:** 04.02.2026
**Ensimmäinen vaihe:** Viikko 1-2 (Auth setup)
**Aikataulu:** 5-10h/viikko

---

## 🚀 Aloita Tänään

### 1. Asenna Supabase (30 min)

```bash
# 1. Mene osoitteeseen https://supabase.io
# 2. Rekisteröidy GitHub-tilillä
# 3. Luo uusi projekti "tilannekuva-online"
#    - Select region: Europe (EU-West-1 Ireland preferred)
#    - Database password: käytä strong password (tallenna turvallisesti)
# 4. Odota project setup (3-5 min)
# 5. Kopioi URL ja anon key
```

### 2. Asetukset Environment Variables (15 min)

```bash
# .env.local tiedostoon
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Asenna npm Packages (10 min)

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install -D @types/node
```

### 4. Luon Database Schema (20 min)

Mene Supabase SQL Editor -kohtaan ja aja tämä:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "New users can create profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create API keys table (tulevaisuus)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  key TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

-- Create user_alerts table (tulevaisuus)
CREATE TABLE user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  enabled BOOLEAN DEFAULT true,
  notification_method TEXT DEFAULT 'email',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE user_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own alerts"
  ON user_alerts FOR ALL
  USING (auth.uid() = user_id);
```

---

## 💻 Koodaa Auth System (Viikko 1)

### File 1: `lib/auth/supabase-client.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)
```

### File 2: `lib/auth/auth-context.tsx`

```typescript
'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, AuthError } from '@supabase/supabase-js'
import { supabase } from './supabase-client'

export interface UserProfile {
  id: string
  email: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  subscription_tier: 'free' | 'premium' | 'pro'
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signUp: (email: string, password: string, fullName?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Init: Check active session
  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession()

        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch (err) {
        console.error('Auth init error:', err)
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Profile doesn't exist yet, create one
        if (error.code === 'PGRST116') {
          const user = (await supabase.auth.getUser()).data.user
          const newProfile = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: user?.email || '',
              subscription_tier: 'free'
            })
            .select()
            .single()

          setProfile(newProfile.data as UserProfile)
        } else {
          throw error
        }
      } else {
        setProfile(data as UserProfile)
      }
    } catch (err) {
      console.error('Profile fetch error:', err)
      setError((err as Error).message)
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setError(null)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })

      if (error) throw error
    } catch (err) {
      const message = (err as AuthError).message || 'Sign up failed'
      setError(message)
      throw err
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
    } catch (err) {
      const message = (err as AuthError).message || 'Sign in failed'
      setError(message)
      throw err
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (err) {
      const message = (err as Error).message || 'Sign out failed'
      setError(message)
      throw err
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      setError(null)
      if (!user) throw new Error('No user logged in')

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      await fetchProfile(user.id)
    } catch (err) {
      const message = (err as Error).message || 'Profile update failed'
      setError(message)
      throw err
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signUp, signIn, signOut, updateProfile, error }}
    >
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
```

### File 3: `app/layout.tsx` - Lisää AuthProvider

```typescript
import { AuthProvider } from '@/lib/auth/auth-context'
import './globals.css'

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fi">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

---

## 🔐 Luon Sign-up & Login Pages (Viikko 1-2)

### File 4: `app/auth/signup/page.tsx`

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import Link from 'next/link'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { signUp, error } = useAuth()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await signUp(email, password, fullName)
      router.push('/auth/verify-email')
    } catch {
      // Error is handled by useAuth hook
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-lg shadow-2xl p-8 border border-slate-700">
          <h1 className="text-3xl font-bold text-white mb-2">Rekisteröidy</h1>
          <p className="text-slate-400 mb-8">Luon tilin käyttääksesi Tilannekuva.online</p>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Koko nimi
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                placeholder="Matti Meikäläinen"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Sähköposti
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                placeholder="matti@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Salasana
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg font-semibold transition"
            >
              {isLoading ? 'Luodaan tiliä...' : 'Rekisteröidy'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-slate-400">
              Sinulla on jo tili?{' '}
              <Link href="/auth/login" className="text-cyan-400 hover:text-cyan-300">
                Kirjaudu sisään
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### File 5: `app/auth/login/page.tsx`

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { signIn, error } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await signIn(email, password)
      router.push('/dashboard')
    } catch {
      // Error handled by useAuth
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-lg shadow-2xl p-8 border border-slate-700">
          <h1 className="text-3xl font-bold text-white mb-2">Kirjaudu sisään</h1>
          <p className="text-slate-400 mb-8">Tervetuloa takaisin Tilannekuva.online:lle</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Sähköposti
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                placeholder="matti@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Salasana
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-cyan-500 focus:outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg font-semibold transition"
            >
              {isLoading ? 'Kirjaudutaan...' : 'Kirjaudu sisään'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-slate-400">
              Sinulla ei ole tiliä?{' '}
              <Link href="/auth/signup" className="text-cyan-400 hover:text-cyan-300">
                Rekisteröidy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### File 6: `app/auth/verify-email/page.tsx`

```typescript
'use client'
import Link from 'next/link'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-lg shadow-2xl p-8 border border-slate-700 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-white mb-4">Tarkista sähköpostisi</h1>
          <p className="text-slate-400 mb-8">
            Olemme lähettäneet vahvistuslinkin sähköpostiosi. Klikkaa sitä varmistaaksesi tilisi.
          </p>

          <div className="bg-slate-700/50 rounded-lg p-4 mb-8 border border-slate-600">
            <p className="text-slate-300 text-sm">
              Linkin ei ole tullut? Tarkista roskapostikansio tai odota muutama minuutti.
            </p>
          </div>

          <Link
            href="/auth/login"
            className="inline-block py-2 px-6 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-semibold transition"
          >
            Takaisin kirjautumiseen
          </Link>
        </div>
      </div>
    </div>
  )
}
```

---

## 📊 Luon Dashboard (Viikko 2)

### File 7: `app/dashboard/page.tsx`

```typescript
'use client'
import { useAuth } from '@/lib/auth/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-500"></div>
          <p className="mt-4">Ladataan...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold">Tervetuloa, {profile?.full_name || profile?.username || 'Käyttäjä'}!</h1>
              <p className="text-slate-400 mt-2">Tilannekuva.online Dashboard</p>
            </div>

            <button
              onClick={async () => {
                const { signOut } = require('@/lib/auth/auth-context')
                // Käytä useAuth hoookia oikein
              }}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
            >
              Kirjaudu ulos
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-slate-400 text-sm font-medium mb-2">Tilaus</h3>
            <p className="text-3xl font-bold">
              {profile?.subscription_tier === 'free' ? '🆓 Ilmainen' : '⭐ Premium'}
            </p>
            <p className="text-slate-400 text-sm mt-4">
              {profile?.subscription_tier === 'free'
                ? 'Päivitä Premium-tasolle lisää ominaisuuksille'
                : 'Kiitos tuesta!'}
            </p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-slate-400 text-sm font-medium mb-2">Käyttäjätili</h3>
            <p className="text-xl font-bold">{profile?.email}</p>
            <p className="text-slate-400 text-sm mt-4">Rekisteröitynyt {new Date(profile?.created_at || '').toLocaleDateString('fi-FI')}</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-slate-400 text-sm font-medium mb-2">Kartta</h3>
            <p className="text-3xl font-bold">6️⃣</p>
            <p className="text-slate-400 text-sm mt-4">Aktiivista tietolähdettä</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/dashboard/profile">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-cyan-500 transition cursor-pointer">
              <h2 className="text-xl font-semibold mb-2">⚙️ Profiilin Asetukset</h2>
              <p className="text-slate-400">Hallitse profiiliasi ja mieltymyksiä</p>
            </div>
          </Link>

          <Link href="/">
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-cyan-500 transition cursor-pointer">
              <h2 className="text-xl font-semibold mb-2">🗺️ Kartta</h2>
              <p className="text-slate-400">Palaa pääkartalle</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
```

---

## ✅ Testing Checklist (Viikko 2 lopuksi)

Ennen kuin siirry Vaiheen 2:een (API Architecture), varmista:

- [ ] Supabase projekti luotu ja running
- [ ] Environment variables asetettu
- [ ] Database tables luotu (profiles, api_keys, user_alerts)
- [ ] Auth context toimii ilman virheitä
- [ ] Sign-up sivu toimii
  - [ ] Voit luoda tilin
  - [ ] Sähköpostivahvistus lähdetään
  - [ ] Tili luodaan Supabaseen
- [ ] Login sivu toimii
  - [ ] Voit kirjautua sisään
  - [ ] Dashboard avautuu
  - [ ] Profiilin data näkyy oikein
- [ ] Logout toimii
- [ ] Reloading ei katkaise sessiota
- [ ] Virheenkäsittely toimii
  - [ ] Väärä salasana näyttää viestin
  - [ ] Olemassaoleva email näyttää viestin

---

## 🎯 Viikko-by-Viikko Ohjeistus

### Viikko 1
**Päivä 1-2:** Supabase setup + environment variables
**Päivä 3-4:** Auth context + client setup
**Päivä 5:** Sign-up sivu
**Viikko lopuksi:** Basic testing

### Viikko 2
**Päivä 1-2:** Login sivu
**Päivä 3:** Verify email sivu + muu polish
**Päivä 4-5:** Dashboard sivu
**Viikko lopuksi:** Comprehensive testing

---

## 🐛 Mahdolliset Ongelmat & Ratkaisut

### "Invalid API key" -virhe
→ Tarkista `.env.local` - NEXT_PUBLIC_SUPABASE_ANON_KEY pitää olla oikea

### Email verification ei lähde
→ Tarkista Supabase Auth settings: "Email confirmations" pitää olla ON

### Profile creation fails
→ Tarkista RLS (Row Level Security) policies - ne pitää sallia INSERT

### Button is disabled after signup
→ Email verification on pending - klikkaa linkkiä sähköpostissa

---

## 📚 Seuraavat Vaiheet (Viikko 3-4)

Kun auth + dashboard on valmis:
1. Lisää profile edit sivu (`app/dashboard/profile/page.tsx`)
2. Lisää settings sivu (`app/dashboard/settings/page.tsx`)
3. Aloita Vaihe 2: API Key Management + Rate Limiting

---

**Valmis?** Aloita asentamalla Supabase! 🚀

