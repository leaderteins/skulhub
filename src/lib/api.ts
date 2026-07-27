'use client'
import { useEffect, useState } from 'react'

interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useFetch<T>(url: string | null, deps?: any[]): FetchState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!!url)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!url) { setLoading(false); return }
    setLoading(true)
    setError(null)
    /* eslint-enable react-hooks/set-state-in-effect */
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error(`Request failed: ${r.status}`)
        const json = await r.json()
        if (!cancelled) { setData(json); setLoading(false) }
      })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false) } })
    return () => { cancelled = true }
  }, [url, tick, ...(deps || [])])

  return { data, loading, error, refetch: () => setTick(t => t + 1) }
}

export async function apiPost<T = any>(url: string, body: any): Promise<T> {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(`Request failed: ${r.status}`)
  return r.json()
}

export async function apiPut<T = any>(url: string, body: any): Promise<T> {
  const r = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(`Request failed: ${r.status}`)
  return r.json()
}

export async function apiDelete<T = any>(url: string): Promise<T> {
  const r = await fetch(url, { method: 'DELETE' })
  if (!r.ok) throw new Error(`Request failed: ${r.status}`)
  return r.json()
}
