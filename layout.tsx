import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { SITE } from '@/lib/tools';
import './globals.css';

const font = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name}: free online PDF tools`, template: `%s | ${SITE.name}` },
  description: 'Merge, split, crop, rotate and edit PDFs for free. Files are processed in your browser and never uploaded.',
  openGraph: { type: 'website', siteName: SITE.name },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={font.variable}>
      <body className="font-sans antialiased">
        <header className="border-b" style={{ borderColor: 'var(--line)' }}>
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-xl font-extrabold no-underline">{SITE.name}</Link>
            <span className="muted hidden text-sm sm:block">Files stay on your device</span>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
        <footer className="border-t" style={{ borderColor: 'var(--line)' }}>
          <div className="muted mx-auto flex max-w-5xl flex-wrap gap-x-6 gap-y-2 px-4 py-8 text-sm">
            <span>© {new Date().getFullYear()} {SITE.name}</span>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <a href={`mailto:${SITE.email}`}>Contact</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
