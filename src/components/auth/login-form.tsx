'use client'
import { useState } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  School, Lock, Mail, Eye, EyeOff, LogIn, Building2, Users, GraduationCap,
  ChevronRight, ArrowLeft, ShieldCheck, Zap, Clock, Smartphone,
} from 'lucide-react'
import { toast } from 'sonner'

const FEATURE_CARDS = [
  { icon: ShieldCheck, title: 'Role-Based Access', desc: '13 staff roles with granular permissions' },
  { icon: Zap, title: 'M-Pesa Ready', desc: 'Auto-update invoices on payment' },
  { icon: Clock, title: 'Live Dashboard', desc: 'Real-time attendance, fees & alerts' },
  { icon: Smartphone, title: 'Parent Portal', desc: 'Parents check fees & grades online' },
]

export function LoginForm() {
  const { serverLogin, login, setAuthView } = useAuthStore()
  const [step, setStep] = useState(1)
  const [schoolCode, setSchoolCode] = useState('')
  const [school, setSchool] = useState<{ id: string; name: string; level: string; schoolCode: string } | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSchoolCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schoolCode.trim()) { toast.error('Please enter your school code'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/school-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolCode: schoolCode.trim() }),
      })
      const data = await res.json()
      if (data.found) {
        setSchool(data.school)
        setStep(2)
      } else {
        toast.error('School code not found', { description: 'Check the code with your school administrator' })
      }
    } catch {
      toast.error('Could not verify school code')
    }
    setLoading(false)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Please enter email and password'); return }
    setLoading(true)
    const result = await serverLogin(email, password)
    if (!result.success) {
      const ok = login(email, password)
      if (ok) {
        toast.success('Welcome to SkulHub')
      } else {
        toast.error('Invalid credentials', { description: 'Check your email and password' })
      }
    }
    setLoading(false)
  }

  const back = () => { setStep(1); setSchool(null); setEmail(''); setPassword('') }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-4">
      {/* Decorative elements */}
      <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-amber-300/5 blur-3xl" />
      <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-300/5 blur-3xl" />

      <div className="relative z-10 grid w-full max-w-5xl gap-6 lg:grid-cols-2">
        {/* Left: Branding */}
        <div className="hidden flex-col justify-center p-8 lg:flex">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-xl text-white shadow-xl">
              <School className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">SkulHub</h1>
              <p className="text-sm text-white/60">School Management System</p>
            </div>
          </div>
          <h2 className="mb-3 text-2xl font-bold text-white">Secure. Role-based. Complete.</h2>
          <p className="mb-8 max-w-md text-sm text-white/70">
            One platform for Kenyan schools & institutions worldwide — students, academics, finance, health,
            transport and more, all in one place.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {FEATURE_CARDS.map(f => {
              const Icon = f.icon
              return (
                <div key={f.title} className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl">
                  <Icon className="mb-1.5 h-5 w-5 text-emerald-300" />
                  <p className="text-xs font-semibold text-white">{f.title}</p>
                  <p className="text-[10px] text-white/50">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Login Form */}
        <Card className="border-0 bg-white/95 shadow-2xl backdrop-blur-xl dark:bg-slate-900/95">
          <CardHeader className="space-y-1 pb-4">
            {step === 1 ? (
              <>
                <CardTitle className="text-xl">Enter your school code</CardTitle>
                <CardDescription>Enter the unique code provided by your school to continue</CardDescription>
              </>
            ) : (
              <>
                <button onClick={back} className="mb-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-3 w-3" /> Back to school code
                </button>
                {school && (
                  <div className="mb-3 flex items-center gap-2.5 rounded-lg border border-emerald-200/50 bg-emerald-50/40 p-2.5 dark:border-emerald-800/50 dark:bg-emerald-950/20">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                      <School className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{school.name}</p>
                      <p className="text-[10px] text-muted-foreground">{school.level} · {school.schoolCode}</p>
                    </div>
                  </div>
                )}
                <CardTitle className="text-xl">Sign in to {school?.name}</CardTitle>
                <CardDescription>Enter your staff credentials to access the dashboard</CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <form onSubmit={handleSchoolCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolCode">School code</Label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="schoolCode"
                      value={schoolCode}
                      onChange={e => setSchoolCode(e.target.value)}
                      placeholder="e.g. SKH-2024-001"
                      className="pl-9"
                      autoComplete="off"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" disabled={loading}>
                  {loading ? 'Checking...' : 'Continue'} <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </form>
            )}
            {step === 2 && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@school.ac.ke" className="pl-9" autoComplete="email" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="px-9" autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" disabled={loading}>
                  {loading ? 'Signing in...' : <><LogIn className="mr-2 h-4 w-4" /> Sign In</>}
                </Button>
              </form>
            )}

            {/* Links */}
            <div className="mt-6 flex flex-col gap-2">
              <button type="button" onClick={() => setAuthView('register')} className="inline-flex items-center gap-1.5 text-left text-emerald-700 hover:underline dark:text-emerald-400">
                <Building2 className="h-4 w-4 shrink-0" />
                <span>Want to register your school? Register school</span>
              </button>
              <button type="button" onClick={() => setAuthView('staff-signup')} className="inline-flex items-center gap-1.5 text-left text-amber-700 hover:underline dark:text-amber-400">
                <GraduationCap className="h-4 w-4 shrink-0" />
                <span>Staff? Sign up to join your school</span>
              </button>
              <button type="button" onClick={() => setAuthView('parent')} className="inline-flex items-center gap-1.5 text-left text-teal-700 hover:underline dark:text-teal-400">
                <Users className="h-4 w-4 shrink-0" />
                <span>Parent? Access parent portal</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Super admin access — hidden, triggered by keyboard shortcut */}
      <SuperAdminAccess />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Hidden Super Admin Access — triggered by Ctrl+Shift+A
// ---------------------------------------------------------------------------
function SuperAdminAccess() {
  const { setAuthView } = useAuthStore()
  const [showDialog, setShowDialog] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        setShowDialog(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleSubmit = () => {
    // Private super admin access code — change this to your own secret code
    if (code === 'skulhub-super-2026') {
      setAuthView('superadmin')
      setShowDialog(false)
      setCode('')
      setError('')
    } else {
      setError('Invalid access code')
    }
  }

  if (!showDialog) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-sm border-0 bg-white shadow-2xl dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5 text-rose-600" /> Super Admin Access
          </CardTitle>
          <CardDescription className="text-xs">Platform owner only</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Access Code</Label>
            <Input
              type="password"
              value={code}
              onChange={e => { setCode(e.target.value); setError('') }}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
              placeholder="Enter access code"
              className="mt-1"
              autoFocus
            />
            {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => { setShowDialog(false); setCode(''); setError('') }}>Cancel</Button>
            <Button size="sm" className="flex-1 bg-rose-600 hover:bg-rose-700" onClick={handleSubmit}>Access</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { useEffect } from 'react'
