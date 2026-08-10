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
  UserPlus,
  Shield,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

export function LoginForm() {
  const { login, serverLogin, setAuthView } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }
    setLoading(true)
    // Try server-side auth first (real DB). On failure, fall back to demo
    // auth so development keeps working without seeded users.
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
    setEmail(userEmail)
    setPassword(userPass)
    setLoading(true)
    // Try server first, then demo
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

  const superAdminLogin = async () => {
    const saEmail = 'superadmin@skulhub.ac.ke'
    const saPass = 'superadmin123'
    setEmail(saEmail)
    setPassword(saPass)
    setLoading(true)
    const result = await serverLogin(saEmail, saPass)
    if (result.success) {
      toast.success('Super Admin signed in', {
        description: 'Platform owner console',
      })
    } else {
      toast.error('Super admin login failed', { description: result.error })
    }
    setLoading(false)
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
          <h2 className="mb-3 text-2xl font-bold text-foreground">Manage your school with confidence</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            A comprehensive platform for Kenyan schools and institutions worldwide — students, academics,
            finance, health, and more, all in one place.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Students', value: '252', color: 'text-emerald-600' },
              { label: 'Staff', value: '58', color: 'text-teal-600' },
              { label: 'Modules', value: '33', color: 'text-violet-600' },
              { label: 'Courses', value: '13', color: 'text-amber-600' },
            ].map(s => (
              <div key={s.label} className="rounded-xl border bg-card/60 p-3 backdrop-blur">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-4 dark:bg-emerald-950/20">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              <Sparkles className="h-4 w-4" /> New to SkulHub?
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Register your school in minutes and start a 30-day free trial — no credit card required.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 border-emerald-300 bg-transparent text-emerald-700 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
              onClick={() => setAuthView('register')}
            >
              <UserPlus className="mr-2 h-4 w-4" /> Register your school
            </Button>
          </div>
        </div>

        {/* Right: Login form */}
        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="mb-2 flex items-center gap-2 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <School className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold">SkulHub</span>
            </div>
            <CardTitle className="text-xl">Sign in to your account</CardTitle>
            <CardDescription>Enter your credentials to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                {loading ? 'Signing in...' : <><LogIn className="mr-2 h-4 w-4" /> Sign In</>}
              </Button>
            </form>

            {/* Register + super admin row */}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setAuthView('register')}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
              >
                <UserPlus className="h-4 w-4" /> Register your school
              </button>
              <button
                type="button"
                onClick={superAdminLogin}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <Shield className="h-4 w-4" /> Super Admin Login
              </button>
            </div>

            {/* Quick login (dev) */}
            <div className="mt-6">
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
                        <AvatarFallback className={`text-[10px] font-semibold ${info.bg} ${info.color}`}>
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
