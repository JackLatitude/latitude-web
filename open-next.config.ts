import { defineCloudflareConfig } from '@opennextjs/cloudflare'

// Defaults are correct for this site: it has no ISR pages needing an
// incremental cache, no tag revalidation, and no queue. Add caching adapters
// here if that changes — see https://opennext.js.org/cloudflare/caching
export default defineCloudflareConfig()
