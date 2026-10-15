import type { Metadata, Viewport } from 'next';
import "./globals.css";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'BroVerse — Экосистема профессионального братства',
  description: 'BroWash • BroBuild • BroFrame • BroMove • BroRent • BroGarden',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate, max-age=0" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className="overflow-x-hidden bg-[#F2F2F7] text-zinc-900 antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var url = new URL(window.location.href);
                if (!url.searchParams.has('v')) {
                  url.searchParams.set('v', Date.now().toString());
                  window.location.replace(url.toString());
                }
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
