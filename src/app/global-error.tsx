'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'

/**
 * global-error.tsx — catches errors in the ROOT layout.
 * Must render its own <html>/<body> since the layout may have failed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #ecfdf5, #f0fdfa, #ecfeff)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '1rem',
        }}
      >
        <div style={{ maxWidth: '28rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ margin: '0 auto', width: '4rem', height: '4rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffe4e6' }}>
            <AlertCircle style={{ width: '2rem', height: '2rem', color: '#f43f5e' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
              SkulHub — Something went wrong
            </h1>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
              We encountered an unexpected error while loading the application.
              Please try refreshing the page.
            </p>
          </div>
          {process.env.NODE_ENV === 'development' && error?.message && (
            <div style={{ borderRadius: '0.5rem', border: '1px solid #fecdd3', background: '#fff1f2', padding: '0.75rem', textAlign: 'left', fontFamily: 'monospace', fontSize: '0.75rem', color: '#be123c', overflow: 'auto', maxHeight: '120px' }}>
              {error.message.slice(0, 300)}
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={reset} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem', background: '#059669', color: 'white', border: 'none', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
              <RefreshCw style={{ width: '1rem', height: '1rem' }} />
              Try Again
            </button>
            <button onClick={() => { window.location.href = '/' }} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.5rem', background: 'white', color: '#0f172a', border: '1px solid #e2e8f0', padding: '0.5rem 1rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}>
              Go Home
            </button>
          </div>
          {error.digest && (
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Error ID: {error.digest}</p>
          )}
        </div>
      </body>
    </html>
  )
}
