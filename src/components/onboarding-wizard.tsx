'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  School, User, Wallet, CheckCircle2, Loader2, ArrowRight, ArrowLeft,
  Sparkles, Shield, BookOpen, Calendar,
} from 'lucide-react'

const STEPS = ['School', 'Admin', 'Fees', 'Review']

export function OnboardingWizard({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any | null>(null)

  const [form, setForm] = useState({
    schoolName: '',
    schoolEmail: '',
    schoolPhone: '',
    schoolLevel: 'Mixed' as 'Primary' | 'Junior Secondary' | 'Secondary' | 'Mixed',
    county: '',
    address: '',
    motto: '',
    primaryColor: '#10b981',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    termFee: 25000,
    boardingFee: 15000,
  })

  function update(key: string, value: any) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function next() {
    if (step === 0 && (!form.schoolName || !form.schoolEmail || !form.schoolPhone)) {
      toast.error('Please fill in school name, email, and phone')
      return
    }
    if (step === 1 && (!form.adminName || !form.adminEmail || !form.adminPassword)) {
      toast.error('Please fill in admin name, email, and password')
      return
    }
    setStep(prev => Math.min(prev + 1, STEPS.length - 1))
  }

  function back() {
    setStep(prev => Math.max(prev - 1, 0))
  }

  async function submit() {
    setLoading(true)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
      toast.success('School set up successfully!', {
        description: `${data.school.name} is ready. Your 30-day trial starts now.`,
        duration: 8000,
      })
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Success screen
  if (result) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-8 text-white shadow-xl">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold">Setup Complete! 🎉</h1>
          <p className="mt-1 text-sm text-white/80">{result.message}</p>
        </div>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Your Login Credentials</h3>
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">School Code:</span><code className="text-sm font-bold text-emerald-600">{result.credentials.schoolCode}</code></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Admin Email:</span><code className="text-sm font-bold">{result.credentials.adminEmail}</code></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Password:</span><code className="text-sm font-bold">{result.credentials.adminPassword}</code></div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">What Was Set Up</h3>
              <div className="grid grid-cols-2 gap-2">
                {result.results.map((r: string, i: number) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {r}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Next Steps</h3>
              <div className="space-y-1">
                {result.nextSteps.map((s: string, i: number) => (
                  <div key={i} className="text-xs text-muted-foreground">{s}</div>
                ))}
              </div>
            </div>

            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={onComplete}>
              Go to Login <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
              i < step ? 'bg-emerald-600 text-white' : i === step ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-400' : 'bg-muted text-muted-foreground'
            }`}>
              {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-xs ${i === step ? 'font-semibold' : 'text-muted-foreground'}`}>{label}</span>
            {i < STEPS.length - 1 && <div className={`h-0.5 w-8 ${i < step ? 'bg-emerald-600' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>

      {/* Step 0: School */}
      {step === 0 && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <School className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold">School Information</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label>School Name *</Label><Input value={form.schoolName} onChange={e => update('schoolName', e.target.value)} placeholder="e.g. SkulHub Academy" /></div>
              <div><Label>School Email *</Label><Input type="email" value={form.schoolEmail} onChange={e => update('schoolEmail', e.target.value)} placeholder="info@school.ac.ke" /></div>
              <div><Label>Phone *</Label><Input value={form.schoolPhone} onChange={e => update('schoolPhone', e.target.value)} placeholder="+254 700 000 000" /></div>
              <div><Label>County</Label><Input value={form.county} onChange={e => update('county', e.target.value)} placeholder="Nairobi" /></div>
              <div><Label>Address</Label><Input value={form.address} onChange={e => update('address', e.target.value)} placeholder="P.O. Box 12345" /></div>
              <div><Label>School Level *</Label><Select value={form.schoolLevel} onValueChange={v => update('schoolLevel', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Primary">Primary (Grade 1-8)</SelectItem><SelectItem value="Junior Secondary">Junior Secondary (Grade 7-9)</SelectItem><SelectItem value="Secondary">Secondary (Form 1-4)</SelectItem><SelectItem value="Mixed">Mixed (All levels)</SelectItem></SelectContent></Select></div>
              <div><Label>Motto</Label><Input value={form.motto} onChange={e => update('motto', e.target.value)} placeholder="Knowledge is Power" /></div>
            </div>
            <div>
              <Label>Brand Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <input type="color" value={form.primaryColor} onChange={e => update('primaryColor', e.target.value)} className="h-9 w-12 rounded border cursor-pointer" />
                <Input value={form.primaryColor} onChange={e => update('primaryColor', e.target.value)} className="w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Admin */}
      {step === 1 && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold">Administrator Account</h2>
            </div>
            <p className="text-sm text-muted-foreground">This person will be the school's primary administrator with full access.</p>
            <div className="grid gap-3">
              <div><Label>Admin Name *</Label><Input value={form.adminName} onChange={e => update('adminName', e.target.value)} placeholder="John Doe" /></div>
              <div><Label>Admin Email *</Label><Input type="email" value={form.adminEmail} onChange={e => update('adminEmail', e.target.value)} placeholder="admin@school.ac.ke" /></div>
              <div><Label>Password *</Label><Input type="password" value={form.adminPassword} onChange={e => update('adminPassword', e.target.value)} placeholder="Choose a strong password" /></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Fees */}
      {step === 2 && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold">Fee Structure</h2>
            </div>
            <p className="text-sm text-muted-foreground">Set default fees. You can adjust these later in Settings.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Term Fee (KES)</Label><Input type="number" value={form.termFee} onChange={e => update('termFee', parseInt(e.target.value) || 0)} placeholder="25000" /></div>
              <div><Label>Boarding Fee (KES)</Label><Input type="number" value={form.boardingFee} onChange={e => update('boardingFee', parseInt(e.target.value) || 0)} placeholder="15000" /></div>
            </div>
            <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/20">
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                <strong>Total per term:</strong> KES {(form.termFee + form.boardingFee).toLocaleString()} (day scholar: KES {form.termFee.toLocaleString()})
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold">Review & Setup</h2>
            </div>
            <div className="space-y-3">
              <div className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold"><School className="h-4 w-4 text-emerald-600" /> {form.schoolName}</div>
                <div className="text-xs text-muted-foreground">{form.schoolEmail} · {form.schoolPhone}</div>
                <div className="text-xs text-muted-foreground">{form.schoolLevel} · {form.county || 'No county'}</div>
              </div>
              <div className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold"><Shield className="h-4 w-4 text-emerald-600" /> {form.adminName}</div>
                <div className="text-xs text-muted-foreground">{form.adminEmail}</div>
              </div>
              <div className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold"><Wallet className="h-4 w-4 text-emerald-600" /> Fee Structure</div>
                <div className="text-xs text-muted-foreground">Term: KES {form.termFee.toLocaleString()} · Boarding: KES {form.boardingFee.toLocaleString()}</div>
              </div>
              <div className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold"><BookOpen className="h-4 w-4 text-emerald-600" /> Auto-Created</div>
                <div className="text-xs text-muted-foreground">Class levels + streams, subjects, fee structure, announcements, biometric device</div>
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-950/20">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <strong>30-day free trial</strong> — No payment required. After the trial, subscribe to continue (Starter: KES 2,000/month).
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={back} disabled={step === 0 || loading}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={next}>
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={submit} disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up...</> : <><Sparkles className="mr-2 h-4 w-4" /> Complete Setup</>}
          </Button>
        )}
      </div>
    </div>
  )
}
