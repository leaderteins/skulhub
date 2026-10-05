'use client'
import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'
export class ErrorBoundary extends React.Component<{ children: React.ReactNode; name?: string }, { hasError: boolean; error: Error | null }> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null } }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error } }
  componentDidCatch(error: Error, info: React.ErrorInfo) { console.error('[ErrorBoundary]', this.props.name || '', error) }
  render() {
    if (this.state.hasError) return (<div className="flex min-h-[400px] items-center justify-center p-4"><div className="max-w-md space-y-4 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/30"><AlertCircle className="h-6 w-6 text-rose-500" /></div><div><p className="text-lg font-semibold">Something went wrong</p><p className="mt-1 text-sm text-muted-foreground">{this.state.error?.message?.slice(0, 200) || 'An unexpected error occurred.'}</p></div><Button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }} className="bg-emerald-600 hover:bg-emerald-700"><RefreshCw className="mr-2 h-4 w-4" /> Reload Page</Button></div></div>)
    return this.props.children
  }
}
