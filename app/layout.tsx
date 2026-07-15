import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Latitude Equipment',
  description: 'Specialist camera equipment for television and film.',
  openGraph: {
    title: 'Latitude Equipment',
    description: 'Specialist camera equipment for television and film.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Sets .js synchronously before paint so reveal-hidden states only
            apply when JS can restore them. No-JS / crawlers render fully visible. */}
        <script
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
