'use client'
import Script from 'next/script'

/**
 * Google Analytics 4 — injects the GA4 script.
 * Set GA_MEASUREMENT_ID env var on Vercel (format: G-XXXXXXXXXX).
 * If not set, the component renders nothing (no error).
 */
export function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.GA_MEASUREMENT_ID
  if (!measurementId) return null
  
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_title: document.title,
            page_location: window.location.href,
            send_page_view: true,
          });
          
          // Track custom events
          window.trackEvent = function(category, action, label, value) {
            gtag('event', action, {
              event_category: category,
              event_label: label,
              value: value,
            });
          };
        `}
      </Script>
    </>
  )
}
