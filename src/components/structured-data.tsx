export function StructuredData() {
  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'SkulHub',
      description: 'The complete school management system for Kenyan schools. 33+ modules, M-Pesa integrated, CBE-aligned.',
      applicationCategory: 'EducationApplication',
      operatingSystem: 'Web',
      url: 'https://www.skulhub.co.ke',
      offers: [
        { '@type': 'Offer', price: '2500', priceCurrency: 'KES', name: 'Starter', description: 'Up to 200 students' },
        { '@type': 'Offer', price: '5000', priceCurrency: 'KES', name: 'Standard', description: 'Up to 500 students' },
        { '@type': 'Offer', price: '10000', priceCurrency: 'KES', name: 'Premium', description: 'Up to 2000 students' },
      ],
      aggregateRating: { '@type': 'AggregateRating', ratingValue: '5', ratingCount: '3' },
      publisher: {
        '@type': 'Organization',
        name: 'SkulHub Technologies',
        url: 'https://www.skulhub.co.ke',
        address: { '@type': 'PostalAddress', addressLocality: 'Nairobi', addressCountry: 'Kenya' },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'SkulHub',
      url: 'https://www.skulhub.co.ke',
      logo: 'https://www.skulhub.co.ke/favicon.svg',
      address: { '@type': 'PostalAddress', addressLocality: 'Nairobi', addressCountry: 'Kenya' },
      contactPoint: { '@type': 'ContactPoint', contactType: 'sales', availableLanguage: ['English', 'Swahili'] },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'SkulHub',
      url: 'https://www.skulhub.co.ke',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://www.skulhub.co.ke/?q={search_term}',
        'query-input': 'required name=search_term',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'What is SkulHub?', acceptedAnswer: { '@type': 'Answer', text: 'SkulHub is a complete school management system for Kenyan schools with 33+ modules.' } },
        { '@type': 'Question', name: 'How much does SkulHub cost?', acceptedAnswer: { '@type': 'Answer', text: 'Starter KES 2,500/month, Standard KES 5,000/month, Premium KES 10,000/month. 30-day free trial.' } },
        { '@type': 'Question', name: 'Is SkulHub CBE compliant?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, SkulHub fully supports CBE (Competency-Based Education) with achievement levels AL1-8.' } },
        { '@type': 'Question', name: 'Does SkulHub support M-Pesa?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, parents can pay fees via M-Pesa Paybill. The system uses Safaricom Daraja API for STK Push.' } },
        { '@type': 'Question', name: 'Can parents access their child records?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, the Parent Portal allows parents to view grades, fees, attendance, homework, and timetable.' } },
        { '@type': 'Question', name: 'Can I try SkulHub before subscribing?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, a 30-day free trial is available with no credit card required.' } },
      ],
    },
  ]
  return <>{schemas.map((s, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />)}</>
}
