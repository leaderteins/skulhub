export function StructuredData() {
  const schemas = [
    { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'SkulHub', description: 'School management system for Kenyan schools', applicationCategory: 'EducationApplication', operatingSystem: 'Web', offers: [{ '@type': 'Offer', price: '2500', priceCurrency: 'KES', name: 'Starter' }, { '@type': 'Offer', price: '5000', priceCurrency: 'KES', name: 'Standard' }, { '@type': 'Offer', price: '10000', priceCurrency: 'KES', name: 'Premium' }], publisher: { '@type': 'Organization', name: 'SkulHub Technologies', address: { '@type': 'PostalAddress', addressLocality: 'Nairobi', addressCountry: 'Kenya' } } },
    { '@context': 'https://schema.org', '@type': 'Organization', name: 'SkulHub', url: 'https://www.skulhub.co.ke', address: { '@type': 'PostalAddress', addressLocality: 'Nairobi', addressCountry: 'Kenya' } },
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'SkulHub', url: 'https://www.skulhub.co.ke' },
  ]
  return <>{schemas.map((s, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />)}</>
}
