import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Profiili — Tilannetieto.fi', description: 'Omat tiedot ja ehdotukset.' };
export default function ProfileLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
