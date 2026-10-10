'use client'

/**
 * Simple A/B testing using localStorage.
 * Assigns visitors to a variant and tracks conversion.
 *
 * Usage:
 * const variant = getVariant('hero_cta', ['A', 'B'])
 * // Show different CTA based on variant
 * trackConversion('hero_cta', variant)
 */

const PREFIX = 'ab_'

export function getVariant(experiment: string, variants: string[]): string {
  if (typeof window === 'undefined') return variants[0]
  
  const key = PREFIX + experiment
  let variant = localStorage.getItem(key)
  
  if (!variant || !variants.includes(variant)) {
    // Randomly assign (50/50 for 2 variants, evenly for more)
    variant = variants[Math.floor(Math.random() * variants.length)]
    localStorage.setItem(key, variant)
  }
  
  return variant
}

export function trackConversion(experiment: string, variant: string) {
  // Track via Google Analytics if available
  if (typeof window !== 'undefined' && (window as any).trackEvent) {
    (window as any).trackEvent('ab_test', 'conversion', `${experiment}:${variant}`)
  }
  
  // Also store in localStorage for debugging
  if (typeof window !== 'undefined') {
    const key = PREFIX + experiment + '_converted'
    localStorage.setItem(key, new Date().toISOString())
  }
}
