import type { Metadata, Viewport } from 'next';
import './globals.css';
import 'mapbox-gl/dist/mapbox-gl.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: 'Tilannekuva.online - Suomen reaaliaikainen kartta',
  description:
    'Yhdistetty näkymä Suomen rikostilastoihin ja liikennetapahtumiin. Reaaliaikaiset tiedot Tilastokeskukselta ja Fintrafficilta.',
  keywords: [
    'kartta',
    'liikenne',
    'rikostilastot',
    'Suomi',
    'reaaliaikainen',
    'tilannekuva',
  ],
  authors: [{ name: 'Tilannekuva.online' }],
  creator: 'IMPERIUM AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fi">
      <body className="bg-zinc-950 text-zinc-50">{children}</body>
    </html>
  );
}
