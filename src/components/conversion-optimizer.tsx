'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, ArrowRight, Clock } from 'lucide-react'

/**
 * Conversion Optimizer — adds:
 * 1. Sticky CTA bar (appears after scrolling 500px)
 * 2. Exit-intent popup (shows when mouse leaves to top)
 * 3. Social proof badges
 */
export function ConversionOptimizer({ onRegister }: { onRegister: () => void }) {
  const [showSticky, setShowSticky] = useState(false)
  const [showExitPopup, setShowExitPopup] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 500)
    window.addEventListener('scroll', onScroll)
    
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !dismissed && !localStorage.getItem('exit_popup_seen')) {
        setShowExitPopup(true)
        localStorage.setItem('exit_popup_seen', '1')
      }
    }
    document.addEventListener('mouseleave', onMouseLeave)
    
    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [dismissed])

  return (
    <>
      {/* Sticky CTA bar (appears after scrolling) */}
      {showSticky && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 px-4 py-3 shadow-lg backdrop-blur-md">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-medium">30-day free trial — no credit card required</p>
            </div>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={onRegister}>
              Start Free Trial <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Exit-intent popup */}
      {showExitPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-card p-8 shadow-2xl">
            <button onClick={() => { setShowExitPopup(false); setDismissed(true) }} className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                <Clock className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold">Wait! Your free trial awaits</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Get 33+ modules, M-Pesa integration, parent portal, and more — free for 30 days.
                No credit card required. Set up in 2 minutes.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => { setShowExitPopup(false); onRegister() }}>
                  Yes, start my free trial <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setShowExitPopup(false); setDismissed(true) }}>
                  No thanks, I'll pay full price later
                </Button>
              </div>
              <p className="mt-3 text-[10px] text-muted-foreground">No credit card · Cancel anytime · Setup in 2 minutes</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
