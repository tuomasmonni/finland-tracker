'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';

export default function SignupPage() {
  const { signUpWithEmail } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Salasanan tulee olla vähintään 6 merkkiä'); return; }
    if (password !== passwordConfirm) { setError('Salasanat eivät täsmää'); return; }
    setIsSubmitting(true);
    const { error } = await signUpWithEmail(email, password, displayName);
    if (error) { setError(error.message); } else { setSuccess(true); }
    setIsSubmitting(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-600/20 flex items-center justify-center"><svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
          <h2 className="text-xl font-bold text-white mb-2">Tili luotu!</h2>
          <p className="text-zinc-400 text-sm mb-6">Lähetimme vahvistuslinkin osoitteeseen <strong className="text-zinc-300">{email}</strong>. Tarkista sähköpostisi.</p>
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium text-sm">Siirry kirjautumaan</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg mb-4"><span className="text-2xl">📍</span></div>
          <h1 className="text-2xl font-bold text-white">Tilannetieto.fi</h1>
          <p className="text-zinc-400 text-sm mt-1">Luo uusi tili</p>
        </div>
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 space-y-5">
          {error && <div className="bg-red-900/30 border border-red-800/50 rounded-lg px-4 py-3 text-sm text-red-300">{error}</div>}
          <form onSubmit={handleSignup} className="space-y-4">
            <div><label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-1.5">Nimi</label><input id="name" type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500" placeholder="Matti Meikäläinen" /></div>
            <div><label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5">Sähköposti</label><input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500" placeholder="nimi@esimerkki.fi" /></div>
            <div><label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1.5">Salasana</label><div className="relative"><input id="password" type={showPassword ? 'text' : 'password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 pr-10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500" placeholder="Vähintään 6 merkkiä" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{showPassword ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /> : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>}</svg></button></div></div>
            <div><label htmlFor="passwordConfirm" className="block text-sm font-medium text-zinc-300 mb-1.5">Salasana uudelleen</label><div className="relative"><input id="passwordConfirm" type={showPassword ? 'text' : 'password'} required minLength={6} value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500" placeholder="Kirjoita salasana uudelleen" /></div></div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-medium rounded-lg px-4 py-2.5 transition-colors">{isSubmitting ? 'Luodaan tiliä...' : 'Luo tili'}</button>
          </form>
          <div className="text-center"><p className="text-sm text-zinc-400">Onko sinulla jo tili? <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">Kirjaudu sisään</Link></p></div>
        </div>
        <div className="text-center mt-6"><Link href="/" className="text-sm text-zinc-500 hover:text-zinc-400 inline-flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>Takaisin karttaan</Link></div>
      </div>
    </div>
  );
}
