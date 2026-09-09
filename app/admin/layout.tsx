import type { Metadata } from 'next'

// The upload tool is local-only (the route 404s in production), but the page
// itself still renders wherever it is deployed. Keep it out of search results:
// an indexed "Gallery Upload" page is an invitation to probe, and it reads as
// unfinished in a results list. robots.txt disallows it too — this covers
// crawlers that ignore robots.txt but honour the meta tag.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
