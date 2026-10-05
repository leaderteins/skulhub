'use client'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Loader2, Shield } from 'lucide-react'
import { toast } from 'sonner'

const PLANS = [
  { name: 'Starter', price: 2500, maxStudents: 200, features: ['All 33+ modules', '5 user accounts', 'Parent portal', 'Email support'] },
  { name: 'Standard', price: 5000, maxStudents: 500, features: ['Everything in Starter', '20 user accounts', 'SMS notifications', 'Priority support', 'M-Pesa integration'] },
  { name: 'Premium', price: 10000, maxStudents: 2000, features: ['Everything in Standard', 'Unlimited users', 'Custom branding', 'Dedicated support', 'API access'], popular: true },
]

export function SubscriptionWall({ schoolName, trialEndsAt }: { schoolName: string; trialEndsAt?: string }) {
  const [phone, setPhone] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('Standard')
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    if (!phone.trim()) { toast.error('Enter your M-Pesa phone number'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/subscriptions/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: selectedPlan, phone: phone.trim() }) })
      const data = await res.json().catch(() => ({}))
      if (data.status === 'pending') { toast.success('STK Push sent! Check your phone to confirm payment.') }
      else if (data.status === 'demo') { toast.success('Plan activated (demo mode).') }
      else { toast.error(data.error || 'Subscription failed') }
    } catch { toast.error('An unexpected error occurred.') }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
            <Shield className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Your Free Trial Has Ended</h1>
          <p className="mt-2 text-sm text-muted-foreground">{schoolName} · Trial ended {trialEndsAt ? new Date(trialEndsAt).toLocaleDateString('en-KE') : 'recently'}. Subscribe to continue using SkulHub.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {PLANS.map(plan => (
            <Card key={plan.name} className={plan.popular ? 'border-2 border-emerald-400 shadow-lg' : ''}>
              <CardContent className="p-6">
                {plan.popular && <Badge className="mb-2 bg-emerald-600 text-white">Most Popular</Badge>}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="mt-1 text-3xl font-bold">KES {plan.price.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                <p className="mt-1 text-xs text-muted-foreground">Up to {plan.maxStudents} students</p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map(f => <li key={f} className="flex items-center gap-2 text-xs"><Check className="h-3 w-3 text-emerald-600" /> {f}</li>)}
                </ul>
                <Button className={`mt-4 w-full ${selectedPlan === plan.name ? 'bg-emerald-600' : ''}`} variant={selectedPlan === plan.name ? 'default' : 'outline'} size="sm" onClick={() => setSelectedPlan(plan.name)}>
                  {selectedPlan === plan.name ? 'Selected' : 'Select'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mx-auto max-w-sm space-y-3">
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="M-Pesa phone (e.g. 0712345678)" className="w-full rounded-lg border px-4 py-3 text-sm" />
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading} onClick={handleSubscribe}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : <>Subscribe with M-Pesa (KES {PLANS.find(p => p.name === selectedPlan)?.price.toLocaleString()})</>}
          </Button>
          <p className="text-center text-xs text-muted-foreground">You'll receive an M-Pesa STK push on your phone. Enter your PIN to complete payment.</p>
        </div>
      </div>
    </div>
  )
}
