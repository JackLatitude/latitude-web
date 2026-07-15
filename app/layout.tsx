import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Latitude Equipment | Drone Operations & Camera Tracking Rigs UK',
  description: 'Specialist drone operations, vehicle tracking rigs, and stabilised gimbal systems for TV, film, and commercial productions. Serving UK and international productions.',
  keywords: 'drone operations UK, vehicle tracking rigs, camera tracking, stabilised gimbal systems, drone filming, film production equipment, TV production services, camera operators',
  metadataBase: new URL('https://latitudeequipment.co.uk'),
  alternates: {
    canonical: 'https://latitudeequipment.co.uk',
  },
  openGraph: {
    title: 'Latitude Equipment | Drone Operations & Camera Tracking Rigs',
    description: 'Specialist drone operations, vehicle tracking rigs, and stabilised gimbal systems for TV, film, and commercial productions across the UK.',
    type: 'website',
    locale: 'en_GB',
    url: 'https://latitudeequipment.co.uk',
    siteName: 'Latitude Equipment',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Latitude Equipment - Specialist Camera Systems for Film & TV',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Latitude Equipment | Drone Operations & Camera Tracking',
    description: 'Specialist drone and camera tracking systems for UK TV and film productions.',
    images: ['/og-image.svg'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://latitudeequipment.co.uk/#organization',
        name: 'Latitude Equipment',
        url: 'https://latitudeequipment.co.uk',
        email: 'info@latitudeequipment.co.uk',
        telephone: '',
        description: 'Specialist camera systems and drone operations for television and film production',
        areaServed: ['GB', 'UK'],
        sameAs: [],
        logo: {
          '@type': 'ImageObject',
          url: 'https://latitudeequipment.co.uk/logo.png',
        },
      },
      {
        '@type': 'LocalBusiness',
        '@id': 'https://latitudeequipment.co.uk/#local-business',
        name: 'Latitude Equipment',
        url: 'https://latitudeequipment.co.uk',
        email: 'info@latitudeequipment.co.uk',
        description: 'Specialist supplier of drone operations, vehicle tracking rigs, and stabilised camera systems for UK and international film and television productions',
        areaServed: 'GB',
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'GB',
          addressRegion: 'United Kingdom',
        },
        priceRange: '$$',
      },
      {
        '@type': 'Service',
        '@id': 'https://latitudeequipment.co.uk/#service-drone-operations',
        name: 'Drone Operations',
        description: 'Professional drone operations and aerial filming services for television, film, and commercial productions across the UK',
        provider: {
          '@id': 'https://latitudeequipment.co.uk/#organization',
        },
        areaServed: 'GB',
        serviceType: 'Drone Operations',
      },
      {
        '@type': 'Service',
        '@id': 'https://latitudeequipment.co.uk/#service-vehicle-tracking',
        name: 'Vehicle Tracking Rigs',
        description: 'Specialist vehicle-mounted camera tracking systems and rigs for dynamic filming on moving vehicles',
        provider: {
          '@id': 'https://latitudeequipment.co.uk/#organization',
        },
        areaServed: 'GB',
        serviceType: 'Vehicle Tracking Rigs',
      },
      {
        '@type': 'Service',
        '@id': 'https://latitudeequipment.co.uk/#service-gimbal-systems',
        name: 'Stabilised Camera Systems',
        description: 'Professional stabilised gimbal systems and camera stabilisation equipment for smooth, steady footage in film and television production',
        provider: {
          '@id': 'https://latitudeequipment.co.uk/#organization',
        },
        areaServed: 'GB',
        serviceType: 'Stabilised Camera Systems',
      },
      {
        '@type': 'Service',
        '@id': 'https://latitudeequipment.co.uk/#service-camera-operation',
        name: 'Camera Operation',
        description: 'Expert camera operating services for television and film productions using specialist camera systems and equipment',
        provider: {
          '@id': 'https://latitudeequipment.co.uk/#organization',
        },
        areaServed: 'GB',
        serviceType: 'Camera Operation',
      },
    ],
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Sets .js synchronously before paint so reveal-hidden states only
            apply when JS can restore them. No-JS / crawlers render fully visible. */}
        <script
          dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
        />
        {/* JSON-LD Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
