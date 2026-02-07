'use client';

import { Suspense, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function LoginContent() {
  const { signInWithEmail, signInWithMagicLink } = useAuth();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<'password' | 'magic'>('password');

  const authError = searchParams.get('error');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    if (mode === 'magic') {
      const { error } = await signInWithMagicLink(email);
      if (error) { setError(error.message); } else { setMagicLinkSent(true); }
    } else {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        setError(error.message === 'Invalid login credentials' ? 'Virheellinen sähköposti tai salasana' : error.message);
      }
    }
    setIsSubmitting(false);
  };

  if (magicLinkSent) {
    return (
      <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-600/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Tarkista sähköpostisi</h2>
        <p className="text-zinc-400 text-sm mb-6">Lähetimme kirjautumislinkin osoitteeseen <strong className="text-zinc-300">{email}</strong></p>
        <button onClick={() => setMagicLinkSent(false)} className="text-sm text-blue-400 hover:text-blue-300">Kokeile toista tapaa</button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg mb-4"><span className="text-2xl">📍</span></div>
        <h1 className="text-2xl font-bold text-white">Tilannetieto.fi</h1>
        <p className="text-zinc-400 text-sm mt-1">Kirjaudu sisään</p>
      </div>
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 space-y-5">
        {(error || authError) && (
          <div className="bg-red-900/30 border border-red-800/50 rounded-lg px-4 py-3 text-sm text-red-300">
            {error || (authError === 'auth' ? 'Kirjautuminen epäonnistui' : 'Palvelun konfiguraatiovirhe')}
          </div>
        )}
        <div className="flex bg-zinc-800 rounded-lg p-1">
          <button onClick={() => setMode('password')} className={`flex-1 text-sm py-2 rounded-md transition-colors ${mode === 'password' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-300'}`}>Salasana</button>
          <button onClick={() => setMode('magic')} className={`flex-1 text-sm py-2 rounded-md transition-colors ${mode === 'magic' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-300'}`}>Kirjautumislinkki</button>
        </div>
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div><label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5">Sähköposti</label><input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500" placeholder="nimi@esimerkki.fi" /></div>
          {mode === 'password' && (<div><label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1.5">Salasana</label><input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500" placeholder="••••••••" /></div>)}
          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium rounded-lg px-4 py-2.5 transition-colors">{isSubmitting ? 'Odota...' : mode === 'magic' ? 'Lähetä kirjautumislinkki' : 'Kirjaudu sisään'}</button>
        </form>
        <div className="text-center"><p className="text-sm text-zinc-400">Ei vielä tiliä? <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium">Rekisteröidy</Link></p></div>
      </div>
      <div className="text-center mt-6"><Link href="/" className="text-sm text-zinc-500 hover:text-zinc-400 inline-flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>Takaisin karttaan</Link></div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Suspense fallback={<div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
