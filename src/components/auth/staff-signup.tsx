'use client'
import { useState } from 'react'
import { useAuthStore, type StaffSignupPayload } from '@/lib/auth-store'
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
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  UserPlus,
  KeyRound,
  BadgeCheck,
  Clock3,
  Sparkles,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react'
import { toast } from 'sonner'

const ROLE_OPTIONS: Array<{ value: string; label: string; hint?: string }> = [
  { value: 'teacher', label: 'Teacher' },
  { value: 'hod', label: 'Head of Department (HOD)' },
  { value: 'librarian', label: 'Librarian' },
  { value: 'nurse', label: 'School Nurse' },
  { value: 'matron', label: 'Matron / Boarding Supervisor' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'admissions', label: 'Admissions Clerk' },
  { value: 'bursar', label: 'Bursar / Finance Officer' },
  { value: 'bus_driver', label: 'Bus Driver' },
  { value: 'gate_man', label: 'Security / Gate Officer' },
  { value: 'cook', label: 'Cook / Kitchen Staff' },
  { value: 'deputy_principal', label: 'Deputy Principal' },
]

const STEPS = [
  {
    icon: UserPlus,
    title: 'Fill in your details',
    desc: 'Enter your school code, personal information and qualifications.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: ShieldCheck,
    title: 'Principal reviews your request',
    desc: 'Your school administrator receives your registration and verifies it.',
    color: 'from-teal-500 to-cyan-600',
  },
  {
    icon: BadgeCheck,
    title: 'Get approved & log in',
    desc: 'Once approved, you can sign in and start using your dashboard.',
    color: 'from-cyan-500 to-emerald-600',
  },
]

interface FormState {
  schoolCode: string
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  role: string
  gender: string
  qualification: string
  specialization: string
}

const INITIAL: FormState = {
  schoolCode: '',
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  role: '',
  gender: '',
  qualification: '',
  specialization: '',
}

export function StaffSignup() {
  const { staffSignup, setAuthView } = useAuthStore()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<{ message: string; schoolName?: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const set = (k: keyof FormState) => (v: string) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const passwordMismatch =
    form.confirmPassword.length > 0 && form.password !== form.confirmPassword
  const passwordTooShort = form.password.length > 0 && form.password.length < 6
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)

  const canSubmit =
    form.schoolCode.trim().length > 0 &&
    form.name.trim().length >= 3 &&
    emailValid &&
    form.password.length >= 6 &&
    !passwordMismatch &&
    !!form.role

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
    if (!form.role) {
      toast.error('Please select your role')
      return
    }
    setLoading(true)
    const payload: StaffSignupPayload = {
      schoolCode: form.schoolCode.trim().toUpperCase(),
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      phone: form.phone.trim() || undefined,
      role: form.role,
      gender: form.gender || undefined,
      qualification: form.qualification.trim() || undefined,
      specialization: form.specialization.trim() || undefined,
    }
    const result = await staffSignup(payload)
    setLoading(false)
    if (result.success) {
      toast.success('Registration submitted!', {
        description: 'Your principal will review and approve your account.',
      })
      setSuccess({
        message:
          result.message ||
          'Your registration has been submitted. The principal will review and approve your account.',
        schoolName: result.schoolName,
      })
      setForm(INITIAL)
    } else {
      toast.error('Sign up failed', { description: result.error })
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
            <h2 className="text-2xl font-bold text-foreground">Registration submitted!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The principal will review your account. You&apos;ll be able to login once approved.
            </p>
            {success.schoolName && (
              <div className="mt-5 rounded-xl border bg-emerald-50/50 p-4 text-left dark:bg-emerald-950/20">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Registered for
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  <School className="h-4 w-4" /> {success.schoolName}
                </p>
              </div>
            )}
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-left dark:border-amber-900 dark:bg-amber-950/20">
              <p className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-400">
                <Clock3 className="h-4 w-4" /> What happens next?
              </p>
              <ul className="mt-2 space-y-1.5 text-xs text-amber-700 dark:text-amber-500">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold">1</span>
                  Your principal receives a notification of your registration.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold">2</span>
                  They verify your details and approve your account.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold">3</span>
                  You&apos;ll receive an email and can sign in with your credentials.
                </li>
              </ul>
            </div>
            <Button
              className="mt-6 w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              onClick={() => {
                setSuccess(null)
                setAuthView('login')
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to login
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
        {/* Left: Branding + 3-step explanation */}
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
          <h2 className="mb-2 text-2xl font-bold text-foreground">
            Join your school team
          </h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Staff members can register themselves in just a few minutes. Your principal will
            review and approve your request before you can log in.
          </p>

          {/* 3-step explanation */}
          <div className="space-y-3">
            {STEPS.map((step, idx) => (
              <div
                key={step.title}
                className="flex items-start gap-3 rounded-xl border bg-card/60 p-3 backdrop-blur"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-md"
                     style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}>
                  <div className={`h-full w-full rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                    <step.icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      Step {idx + 1}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-4 dark:bg-emerald-950/20">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              <Sparkles className="h-4 w-4" /> Need your school code?
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Ask your principal or school administrator — they&apos;ll share the unique code that links
              you to your school.
            </p>
          </div>
        </div>

        {/* Right: Staff signup form */}
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
              <span className="text-lg font-bold">SkulHub</span>
            </div>
            <CardTitle className="text-xl">Staff self-registration</CardTitle>
            <CardDescription>
              New staff member? Register yourself and your principal will approve.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* School code */}
              <div className="space-y-2">
                <Label htmlFor="schoolCode">School code *</Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="schoolCode"
                    value={form.schoolCode}
                    onChange={e => set('schoolCode')(e.target.value.toUpperCase())}
                    placeholder="e.g. SKH-2024-001"
                    className="pl-9 font-mono uppercase tracking-wider"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Ask your principal for the school code.
                </p>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full name *</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    value={form.name}
                    onChange={e => set('name')(e.target.value)}
                    placeholder="e.g. Jane Wanjiru Kamau"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              {/* Email + phone */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={e => set('email')(e.target.value)}
                      placeholder="you@school.ac.ke"
                      className={`pl-9 ${form.email && !emailValid ? 'border-rose-400 focus-visible:ring-rose-400' : ''}`}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={e => set('phone')(e.target.value)}
                      placeholder="0712 345 678"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              {/* Password + confirm */}
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
                      className={`pl-9 ${passwordTooShort ? 'border-rose-400 focus-visible:ring-rose-400' : ''}`}
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
                  </div>
                  {passwordMismatch && (
                    <p className="text-xs text-rose-600">Passwords do not match.</p>
                  )}
                </div>
              </div>

              {/* Role + Gender */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select value={form.role} onValueChange={set('role')}>
                    <SelectTrigger id="role">
                      <span className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Select your role" />
                      </span>
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {ROLE_OPTIONS.map(r => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={form.gender} onValueChange={set('gender')}>
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Qualification + specialization */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="qualification">Qualification</Label>
                  <Input
                    id="qualification"
                    value={form.qualification}
                    onChange={e => set('qualification')(e.target.value)}
                    placeholder="e.g. BEd Mathematics"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    value={form.specialization}
                    onChange={e => set('specialization')(e.target.value)}
                    placeholder="e.g. Mathematics & Physics"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                disabled={loading || !canSubmit}
              >
                {loading ? (
                  'Submitting registration...'
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" /> Submit Registration
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Your principal will review your registration before you can log in.
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
