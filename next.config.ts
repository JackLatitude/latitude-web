import type { NextConfig } from 'next'

const config: NextConfig = {
  // Pin the tracing root to this project (a lockfile exists higher up in ~/).
  outputFileTracingRoot: __dirname,
}

export default config
