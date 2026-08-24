import type { NextConfig } from 'next'

const config: NextConfig = {
  // Pin the tracing root to this project (a lockfile exists higher up in ~/).
  outputFileTracingRoot: __dirname,

  images: {
    // Cloudflare Workers has no Next image optimizer: the default /_next/image
    // loader is unsupported there and would 500. The only next/image uses on
    // the site are the two wordmark PNGs in Nav and Footer, rendered at 28px
    // and 22px tall — there is nothing worth optimizing, and this avoids a
    // dependency on the (billed) Cloudflare Images product.
    //
    // Gallery photos don't go through next/image at all; react-photo-album
    // renders plain <img> against public/gallery/, so they are unaffected.
    //
    // If next/image is ever used for real photography, swap this for the
    // Images binding — https://opennext.js.org/cloudflare/howtos/image
    unoptimized: true,
  },
}

export default config
