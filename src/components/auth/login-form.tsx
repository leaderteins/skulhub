'use client'
import { useState } from 'react'
import { useAuthStore, DEMO_USERS, ROLE_INFO } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  School,
  Lock,
  Mail,
  LogIn,
  Eye,
  EyeOff,
  Users,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Building2,
  UserPlus,
  GraduationCap,
  ClipboardList,
  Smartphone,
} from 'lucide-react'
import { toast } from 'sonner'

interface SchoolInfo {
  id: string
  name: string
  slug: string
  level: string
  logo: string | null
  schoolCode: string
}

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Role-Based Access',
    desc: '13 staff roles, each with scoped permissions',
  },
  {
    icon: GraduationCap,
    title: 'Per Class Data',
    desc: 'Streams, subjects & enrollments isolated',
  },
  {
    icon: ClipboardList,
    title: 'Audit Trail',
    desc: 'Every action logged for accountability',
  },
  {
    icon: Smartphone,
    title: 'M-Pesa Ready',
    desc: 'Native Paybill & STK push integration',
  },
]

export function LoginForm() {
  const { login, serverLogin, setAuthView } = useAuthStore()
  const [step, setStep] = useState<1 | 2>(1)
  const [schoolCode, setSchoolCode] = useState('')
  const [school, setSchool] = useState<SchoolInfo | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)

  // --- Step 1: school code lookup ----------------------------------------
  const handleSchoolCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schoolCode.trim()) {
      toast.error('Enter your school code')
      return
    }
    setLookingUp(true)
    try {
      const res = await fetch('/api/auth/school-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolCode: schoolCode.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!data.found) {
        toast.error('School code not found', {
          description: 'Check the code with your school administrator.',
        })
        setLookingUp(false)
        return
      }
      setSchool(data.school as SchoolInfo)
      setStep(2)
      toast.success('School found', { description: data.school.name })
    } catch {
      toast.error('Lookup failed', { description: 'Please try again.' })
    }
    setLookingUp(false)
  }

  // --- Step 2: email + password (real DB auth, demo fallback) ------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }
    setLoading(true)
    const result = await serverLogin(email, password)
    if (result.success) {
      toast.success('Welcome back!', { description: 'Login successful' })
    } else {
      // Fallback: try demo login (dev mode)
      const ok = login(email, password)
      if (ok) {
        toast.success('Welcome back! (Demo mode)', {
          description: 'Logged in with a demo account.',
        })
      } else {
        toast.error('Invalid credentials', {
          description: result.error || 'Check your email and password',
        })
      }
    }
    setLoading(false)
  }

  const quickLogin = async (userEmail: string, userPass: string) => {
    setLoading(true)
    const result = await serverLogin(userEmail, userPass)
    if (result.success) {
      toast.success('Logged in', { description: 'Welcome to SkulHub' })
    } else {
      const ok = login(userEmail, userPass)
      if (ok) {
        toast.success('Logged in (Demo mode)', {
          description: 'Welcome to SkulHub',
        })
      } else {
        toast.error('Login failed', { description: result.error })
      }
    }
    setLoading(false)
  }

  const back = () => {
    setStep(1)
    setSchool(null)
    setEmail('')
    setPassword('')
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
      {/* Decorative blobs */}
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-teal-300/30 blur-3xl" />
      <div className="absolute left-1/2 top-1/3 h-48 w-48 -translate-x-1/2 rounded-full bg-cyan-300/20 blur-3xl" />

      <div className="relative z-10 grid w-full max-w-5xl gap-6 lg:grid-cols-2">
        {/* Left: Branding */}
        <div className="hidden flex-col justify-center p-8 lg:flex">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/30">
              <School className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">SkulHub</h1>
              <p className="text-sm text-muted-foreground">School Management System</p>
            </div>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-foreground">Secure. Role-based. Complete.</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            One platform for Kenyan schools &amp; institutions worldwide — students, academics,
            finance, health, transport and more, all in one place.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map(f => (
              <div key={f.title} className="rounded-xl border bg-card/60 p-3 backdrop-blur">
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <f.icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-foreground">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Login card */}
        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="mb-2 flex items-center gap-2 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <School className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold">SkulHub</span>
            </div>

            {step === 1 && (
              <>
                <CardTitle className="text-xl">Enter your school code</CardTitle>
                <CardDescription>Look up your school to continue.</CardDescription>
              </>
            )}

            {step === 2 && school && (
              <>
                <button
                  type="button"
                  onClick={back}
                  className="mb-2 inline-flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <div className="mb-3 flex items-center gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50/60 p-3 dark:bg-emerald-950/20">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <School className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{school.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {school.level} · {school.schoolCode}
                    </p>
                  </div>
                </div>
                <CardTitle className="text-xl">Sign in to {school.name}</CardTitle>
                <CardDescription>
                  Enter your staff credentials to access the dashboard.
                </CardDescription>
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
                      className="pl-9 uppercase tracking-wider"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Don&apos;t know your school code? Ask your administrator.
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  disabled={lookingUp}
                >
                  {lookingUp ? (
                    'Looking up...'
                  ) : (
                    <>
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@skulhub.ac.ke"
                      className="pl-9"
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="px-9"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  disabled={loading}
                >
                  {loading ? (
                    'Signing in...'
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" /> Sign In
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Links */}
            <div className="mt-5 flex flex-col gap-1.5 text-sm">
              <button
                type="button"
                onClick={() => setAuthView('register')}
                className="inline-flex items-center gap-1.5 text-left text-emerald-700 hover:underline dark:text-emerald-400"
              >
                <UserPlus className="h-4 w-4 shrink-0" />
                <span>Don&apos;t have an account? Sign up</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthView('register')}
                className="inline-flex items-center gap-1.5 text-left text-muted-foreground hover:text-foreground"
              >
                <Building2 className="h-4 w-4 shrink-0" />
                <span>Want to register your school? Register school</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthView('staff-signup')}
                className="inline-flex items-center gap-1.5 text-left text-amber-700 hover:underline dark:text-amber-400"
              >
                <GraduationCap className="h-4 w-4 shrink-0" />
                <span>Staff? Sign up to join your school</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthView('parent')}
                className="inline-flex items-center gap-1.5 text-left text-teal-700 hover:underline dark:text-teal-400"
              >
                <Users className="h-4 w-4 shrink-0" />
                <span>Parent? Access parent portal</span>
              </button>
            </div>

            {/* Quick login (dev) */}
            <div className="mt-5">
              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>Quick login — click a role to sign in instantly (demo)</span>
              </div>
              <div className="grid max-h-72 grid-cols-1 gap-1.5 overflow-y-auto pr-1">
                {DEMO_USERS.map(u => {
                  const info = ROLE_INFO[u.role]
                  return (
                    <button
                      key={u.id}
                      onClick={() => quickLogin(u.email, u.password)}
                      disabled={loading}
                      className="group flex items-center gap-3 rounded-lg border p-2.5 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50/50 disabled:opacity-50 dark:hover:bg-emerald-950/20"
                    >
                      <Avatar className="h-8 w-8 border">
                        <AvatarFallback
                          className={`text-[10px] font-semibold ${info.bg} ${info.color}`}
                        >
                          {u.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{u.name}</p>
                        <p className="truncate text-[10px] text-muted-foreground">{info.label}</p>
                      </div>
                      <span className="text-base">{info.icon}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
