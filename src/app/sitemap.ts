import type { MetadataRoute } from 'next'
export default function sitemap(): MetadataRoute.Sitemap {
  const b = 'https://www.skulhub.co.ke'; const d = new Date()
  return [
    { url: b, lastModified: d, changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: `${b}/privacy`, lastModified: d, changeFrequency: 'yearly' as const, priority: 0.5 },
    { url: `${b}/terms`, lastModified: d, changeFrequency: 'yearly' as const, priority: 0.5 },
    { url: `${b}/offline`, lastModified: d, changeFrequency: 'yearly' as const, priority: 0.3 },
    { url: `${b}/#features`, lastModified: d, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${b}/#pricing`, lastModified: d, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${b}/#faq`, lastModified: d, changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${b}/#contact`, lastModified: d, changeFrequency: 'yearly' as const, priority: 0.6 },
  ]
}
