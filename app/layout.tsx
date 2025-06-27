import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1f2937" />
      </head>
      <body className="min-h-screen">
        {children}

        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then(reg => console.log('✅ Service Worker registered:', reg.scope))
                  .catch(err => console.error('❌ SW registration failed:', err));
              });
            }
          `
        }} />
      </body>
    </html>
  )
}

