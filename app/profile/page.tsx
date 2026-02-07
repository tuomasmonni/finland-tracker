'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getSupabaseBrowserClient } from '@/lib/db/supabase-browser';
import StatusBadge from '@/components/roadmap/StatusBadge';
import CategoryBadge from '@/components/roadmap/CategoryBadge';
import Link from 'next/link';

interface UserItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  vote_count: number;
  created_at: string;
}

interface Stats {
  total: number;
  approved: number;
  completed: number;
  votes_given: number;
}

const STATUS_ORDER = ['proposed', 'planned', 'in_progress', 'completed', 'rejected'];
const STATUS_LABELS: Record<string, string> = {
  proposed: 'Ehdotettu',
  planned: 'Suunnitteilla',
  in_progress: 'Työn alla',
  completed: 'Toteutettu',
  rejected: 'Hylätty',
};

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [stats, setStats] = useState<Stats>({ total: 0, approved: 0, completed: 0, votes_given: 0 });
  const [items, setItems] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [profile]);

  const fetchData = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user) return;

    const [itemsRes, votesRes] = await Promise.all([
      supabase.from('roadmap_items').select('id, title, description, category, status, vote_count, created_at').eq('author_id', user.id).order('created_at', { ascending: false }),
      supabase.from('roadmap_votes').select('item_id').eq('user_id', user.id),
    ]);

    if (itemsRes.data) {
      setItems(itemsRes.data);
      setStats({
        total: itemsRes.data.length,
        approved: itemsRes.data.filter(i => ['planned', 'in_progress', 'completed'].includes(i.status)).length,
        completed: itemsRes.data.filter(i => i.status === 'completed').length,
        votes_given: votesRes.data?.length || 0,
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveName = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user || !displayName.trim()) return;
    setSaving(true);
    setMsg('');
    const { error } = await supabase.from('profiles').update({ display_name: displayName.trim() }).eq('id', user.id);
    if (error) { setMsg('Tallennus epäonnistui'); } else { setMsg('Nimi päivitetty!'); setEditing(false); }
    setSaving(false);
  };

  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('fi-FI', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  const groupedByStatus = STATUS_ORDER.reduce((acc, status) => {
    const filtered = items.filter(i => i.status === status);
    if (filtered.length > 0) acc.push({ status, label: STATUS_LABELS[status], items: filtered });
    return acc;
  }, [] as { status: string; label: string; items: UserItem[] }[]);

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Karttaan
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/roadmap" className="text-sm text-zinc-400 hover:text-white transition-colors">Roadmap</Link>
            <button onClick={signOut} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Ulos</button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Profiili</h1>

        {/* User info */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
              {(profile?.display_name || user?.email || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex items-center gap-2">
                  <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={50} className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                  <button onClick={handleSaveName} disabled={saving} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 rounded-lg transition-colors">{saving ? '...' : 'Tallenna'}</button>
                  <button onClick={() => { setEditing(false); setDisplayName(profile?.display_name || ''); }} className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors">Peruuta</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-white">{profile?.display_name || 'Nimetön'}</h2>
                  <button onClick={() => setEditing(true)} className="text-zinc-500 hover:text-zinc-300 transition-colors" title="Muokkaa nimeä">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                </div>
              )}
              {msg && <p className={`text-xs mt-1 ${msg.includes('epäonnistui') ? 'text-red-400' : 'text-green-400'}`}>{msg}</p>}
              <p className="text-sm text-zinc-400 mt-0.5">{user?.email}</p>
              {memberSince && <p className="text-xs text-zinc-500 mt-1">Jäsen {memberSince} alkaen</p>}
              {profile?.role === 'admin' && <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30">Admin</span>}
            </div>
          </div>
        </div>

        {/* Stats */}
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Tilastot</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-zinc-400 mt-1">Ehdotuksia</p>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">{stats.approved}</p>
            <p className="text-xs text-zinc-400 mt-1">Hyväksytty</p>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
            <p className="text-xs text-zinc-400 mt-1">Toteutettu</p>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-purple-400">{stats.votes_given}</p>
            <p className="text-xs text-zinc-400 mt-1">Ääniä annettu</p>
          </div>
        </div>

        {/* User's proposals grouped by status */}
        <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Omat ehdotukset</h2>

        {loading ? (
          <div className="text-center py-12 text-zinc-500">Ladataan...</div>
        ) : items.length === 0 ? (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-8 text-center">
            <p className="text-zinc-500 mb-2">Et ole vielä ehdottanut ominaisuuksia.</p>
            <Link href="/roadmap" className="text-sm text-blue-400 hover:text-blue-300">Siirry roadmapiin ehdottamaan</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByStatus.map(group => (
              <div key={group.status}>
                <div className="flex items-center gap-2 mb-2">
                  <StatusBadge status={group.status} />
                  <span className="text-xs text-zinc-500">({group.items.length})</span>
                </div>
                <div className="space-y-2">
                  {group.items.map(item => (
                    <div key={item.id} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{item.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <CategoryBadge category={item.category} />
                            <span className="text-[11px] text-zinc-500">{new Date(item.created_at).toLocaleDateString('fi-FI')}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-center px-2 py-1 rounded-lg bg-zinc-800 border border-zinc-700 flex-shrink-0">
                          <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                          <span className="text-sm font-bold text-zinc-300">{item.vote_count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick links */}
        <div className="flex gap-3 mt-8">
          <Link href="/roadmap" className="flex-1 text-center px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors">
            Roadmap
          </Link>
          <Link href="/" className="flex-1 text-center px-4 py-2.5 text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors">
            Karttaan
          </Link>
        </div>
      </main>
    </div>
  );
}
