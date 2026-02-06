'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';

interface SidebarFooterProps {
  collapsed: boolean;
}

export default function SidebarFooter({ collapsed }: SidebarFooterProps) {
  const { user, profile, signOut, isLoading } = useAuth();

  if (collapsed) {
    return (
      <div className="p-2 border-t border-white/10 space-y-2">
        {!isLoading && (
          user ? (
            <Link
              href="/roadmap"
              className="block w-8 h-8 mx-auto rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium hover:bg-blue-500 transition-colors"
              title="Roadmap"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                (profile?.display_name || user.email || '?')[0].toUpperCase()
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="block w-8 h-8 mx-auto rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
              title="Kirjaudu sisään"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          )
        )}
        <span className="block text-center text-[10px] text-zinc-600">
          tilannetieto.fi
        </span>
      </div>
    );
  }

  return (
    <div className="p-3 border-t border-white/10 space-y-2">
      {!isLoading && (
        user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  (profile?.display_name || user.email || '?')[0].toUpperCase()
                )}
              </div>
              <span className="text-xs text-zinc-300 truncate">
                {profile?.display_name || user.email}
              </span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Link
                href="/roadmap"
                className="px-2 py-1 text-[10px] text-blue-400 hover:text-blue-300 font-medium"
              >
                Roadmap
              </Link>
              <button
                onClick={() => signOut()}
                className="text-zinc-500 hover:text-zinc-300 p-1"
                title="Kirjaudu ulos"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Kirjaudu sisään
          </Link>
        )
      )}
      <div className="flex items-center justify-end">
        <span className="text-[10px] text-zinc-600">
          tilannetieto.fi
        </span>
      </div>
    </div>
  );
}
