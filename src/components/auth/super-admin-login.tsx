'use client'
import { useState } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  LogIn,
  Globe2,
  ServerCog,
  Building2,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

const PLATFORM_FEATURES = [
  { icon: Building2, title: 'Multi-Tenant', desc: 'Manage every school on the platform' },
  { icon: ServerCog, title: 'Platform Controls', desc: 'Activate, suspend, upgrade plans' },
  { icon: Globe2, title: 'Global Analytics', desc: 'Cross-school revenue & student metrics' },
]

export function SuperAdminLoginForm() {
  const { serverLogin, login, setAuthView } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Email and password are required')
      toast.error('Email and password are required')
      return
    }

    setLoading(true)
    const result = await serverLogin(email.trim(), password)
    if (!result.success) {
      const ok = login(email.trim(), password)
      if (ok && email.toLowerCase().includes('superadmin')) {
        toast.success('Welcome to SkulHub Platform')
      } else {
        const msg = result.error || 'Invalid credentials'
        setError(msg)
        toast.error('Super admin login failed', { description: msg })
      }
    } else {
      toast.success('Welcome back, Platform Super Admin')
    }
    setLoading(false)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-4">
      {/* Decorative gradient orbs */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-rose-500/10 blur-3xl" />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 grid w-full max-w-5xl gap-6 lg:grid-cols-2">
        {/* Left: Branding */}
        <div className="hidden flex-col justify-center p-8 lg:flex">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/30">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">SkulHub Platform</h1>
              <p className="text-sm text-white/60">Platform Owner Console</p>
            </div>
          </div>
          <h2 className="mb-3 text-2xl font-bold text-white">
            Manage every school. One dashboard.
          </h2>
          <p className="mb-8 max-w-md text-sm text-white/70">
            The super admin console is reserved for the platform owner. Manage
            schools, monitor revenue, activate trials and oversee the entire
            SkulHub network from a single, secure location.
          </p>
          <div className="space-y-3">
            {PLATFORM_FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.title}</p>
                    <p className="text-xs text-white/60">{f.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Login form */}
        <Card className="border-0 bg-white/95 shadow-2xl backdrop-blur-xl dark:bg-slate-900/95">
          <CardHeader className="space-y-1 pb-4">
            <button
              type="button"
              onClick={() => setAuthView('login')}
              className="mb-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" /> Back to school login
            </button>
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-lg">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Platform Super Admin</CardTitle>
                <CardDescription className="text-xs">
                  Sign in to the platform owner console
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sa-email">Platform email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="sa-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                    placeholder="Enter your platform email"
                    className="pl-9"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sa-password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="sa-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                    placeholder="Enter your password"
                    className="px-9"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-800 dark:bg-rose-950/30">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <p className="text-xs text-rose-700 dark:text-rose-300">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800"
                disabled={loading}
              >
                {loading ? 'Signing in...' : <><LogIn className="mr-2 h-4 w-4" /> Access Platform Console</>}
              </Button>
            </form>

            <div className="mt-6 flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/5 p-3">
              <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Restricted area. Authorized platform personnel only.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
