import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GafferDex — The Fantasy Transfer & Club Exchange',
  description: 'Gamified Premier League transfer market tracking & Sporting Director simulator.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0A0E17] text-slate-100 antialiased selection:bg-[#00FF87] selection:text-black">
        {children}
      </body>
    </html>
  );
}
