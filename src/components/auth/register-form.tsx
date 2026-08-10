'use client'
import { useState } from 'react'
import { useAuthStore, type ServerRegisterPayload } from '@/lib/auth-store'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  School,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Rocket,
} from 'lucide-react'
import { toast } from 'sonner'

const KENYAN_COUNTIES = [
  'Nairobi', 'Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita-Taveta',
  'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru', 'Tharaka-Nithi',
  'Embu', 'Kitui', 'Machakos', 'Makueni', 'Nyandarua', 'Nyeri', 'Kirinyaga',
  "Murang'a", 'Kiambu', 'Turkana', 'West Pokot', 'Samburu', 'Trans Nzoia',
  'Uasin Gishu', 'Elgeyo-Marakwet', 'Nandi', 'Baringo', 'Laikipia', 'Nakuru',
  'Narok', 'Kajiado', 'Kericho', 'Bomet', 'Kakamega', 'Vihiga', 'Bungoma',
  'Busia', 'Siaya', 'Kisumu', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira', 'Other',
]

interface FormState {
  schoolName: string
  schoolEmail: string
  schoolPhone: string
  county: string
  adminName: string
  adminEmail: string
  password: string
  confirmPassword: string
}

const INITIAL: FormState = {
  schoolName: '',
  schoolEmail: '',
  schoolPhone: '',
  county: '',
  adminName: '',
  adminEmail: '',
  password: '',
  confirmPassword: '',
}

export function RegisterForm() {
  const { serverRegister, setAuthView } = useAuthStore()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<{ schoolName: string; slug: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const set = (k: keyof FormState) => (v: string) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const passwordMismatch =
    form.confirmPassword.length > 0 && form.password !== form.confirmPassword

  const passwordTooShort = form.password.length > 0 && form.password.length < 6

  const canSubmit =
    form.schoolName.trim().length > 1 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail) &&
    form.adminName.trim().length > 1 &&
    form.password.length >= 6 &&
    !passwordMismatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordMismatch) {
      toast.error('Passwords do not match')
      return
    }
    if (passwordTooShort) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    const payload: ServerRegisterPayload = {
      schoolName: form.schoolName.trim(),
      schoolEmail: form.schoolEmail.trim(),
      schoolPhone: form.schoolPhone.trim(),
      county: form.county,
      adminName: form.adminName.trim(),
      adminEmail: form.adminEmail.trim(),
      adminPassword: form.password,
    }
    const result = await serverRegister(payload)
    setLoading(false)
    if (result.success && result.school) {
      toast.success('School registered!', {
        description: `Welcome to EduManage Pro — your trial lasts 30 days.`,
      })
      setSuccess({ schoolName: result.school.name, slug: result.school.slug })
    } else {
      toast.error('Registration failed', { description: result.error })
    }
  }

  // --- Success screen -------------------------------------------------------
  if (success) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-teal-300/30 blur-3xl" />
        <Card className="relative z-10 w-full max-w-lg border-0 shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/30">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Welcome aboard!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your school <span className="font-semibold text-foreground">{success.schoolName}</span> has been registered.
              A 30-day free trial is now active.
            </p>
            <div className="mt-5 rounded-xl border bg-emerald-50/50 p-4 text-left dark:bg-emerald-950/20">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Your school URL slug
              </p>
              <p className="mt-1 break-all font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                {success.slug}
              </p>
            </div>
            <Button
              className="mt-6 w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              onClick={() => {
                // The user was auto-logged-in by serverRegister. Flip authView
                // back to 'login' so page.tsx renders the school dashboard.
                setAuthView('login')
                setSuccess(null)
              }}
            >
              <Rocket className="mr-2 h-4 w-4" /> Enter Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
      {/* Decorative blobs */}
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-teal-300/30 blur-3xl" />
      <div className="absolute left-1/2 top-1/3 h-48 w-48 -translate-x-1/2 rounded-full bg-cyan-300/20 blur-3xl" />

      <div className="relative z-10 grid w-full max-w-5xl gap-6 lg:grid-cols-2">
        {/* Left: Branding + trust signals */}
        <div className="hidden flex-col justify-center p-8 lg:flex">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/30">
              <School className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">EduManage Pro</h1>
              <p className="text-sm text-muted-foreground">School Management System</p>
            </div>
          </div>
          <h2 className="mb-3 text-2xl font-bold text-foreground">
            Start your 30-day free trial
          </h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            No credit card required. Set up your school in minutes and gain access to
            30+ modules — students, academics, finance, health, transport, and more.
          </p>

          <div className="space-y-3">
            {[
              { icon: Rocket, title: 'Instant setup', desc: 'Be up and running in under 2 minutes.' },
              { icon: ShieldCheck, title: 'Your data is safe', desc: 'Encrypted passwords, isolated tenancy.' },
              { icon: Sparkles, title: 'Pre-loaded curriculum', desc: 'Form 1–4 classes & 15 default subjects.' },
            ].map(f => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <f.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Registration form */}
        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <button
              type="button"
              onClick={() => setAuthView('login')}
              className="mb-2 inline-flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to login
            </button>
            <div className="mb-2 flex items-center gap-2 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <School className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold">EduManage Pro</span>
            </div>
            <CardTitle className="text-xl">Register your school</CardTitle>
            <CardDescription>
              Create an administrator account for your institution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* School section */}
              <div className="space-y-3 rounded-xl border bg-card/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                  School details
                </p>
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School name *</Label>
                  <div className="relative">
                    <School className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="schoolName"
                      value={form.schoolName}
                      onChange={e => set('schoolName')(e.target.value)}
                      placeholder="e.g. St. Mary's Academy"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="schoolEmail">School email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="schoolEmail"
                        type="email"
                        value={form.schoolEmail}
                        onChange={e => set('schoolEmail')(e.target.value)}
                        placeholder="info@school.ac.ke"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schoolPhone">School phone</Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="schoolPhone"
                        value={form.schoolPhone}
                        onChange={e => set('schoolPhone')(e.target.value)}
                        placeholder="0712 345 678"
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="county">County</Label>
                  <Select value={form.county} onValueChange={set('county')}>
                    <SelectTrigger id="county">
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Select county" />
                      </span>
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {KENYAN_COUNTIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Admin section */}
              <div className="space-y-3 rounded-xl border bg-card/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
                  Administrator account
                </p>
                <div className="space-y-2">
                  <Label htmlFor="adminName">Administrator name *</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="adminName"
                      value={form.adminName}
                      onChange={e => set('adminName')(e.target.value)}
                      placeholder="e.g. Jane Wanjiru"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Administrator email *</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="adminEmail"
                      type="email"
                      value={form.adminEmail}
                      onChange={e => set('adminEmail')(e.target.value)}
                      placeholder="admin@school.ac.ke"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={e => set('password')(e.target.value)}
                        placeholder="Min 6 characters"
                        className="pl-9"
                        required
                      />
                    </div>
                    {passwordTooShort && (
                      <p className="text-xs text-rose-600">Password must be at least 6 characters.</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm password *</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={e => set('confirmPassword')(e.target.value)}
                        placeholder="Re-enter password"
                        className={`pl-9 ${passwordMismatch ? 'border-rose-400 focus-visible:ring-rose-400' : ''}`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {passwordMismatch && (
                      <p className="text-xs text-rose-600">Passwords do not match.</p>
                    )}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                disabled={loading || !canSubmit}
              >
                {loading ? (
                  'Creating your account...'
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" /> Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                By registering, you agree to EduManage Pro&apos;s Terms of Service and Privacy Policy.
              </p>

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthView('login')}
                  className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  Sign in
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
