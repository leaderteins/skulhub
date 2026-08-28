'use client'
import { useMemo, useState } from 'react'
import { useAuthStore, type ServerRegisterPayload } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
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
  Building2,
  GraduationCap,
  Venus,
  Mars,
  Users as UsersIcon,
  Palette,
  Upload,
  Hash,
  CalendarDays,
  Quote,
  Eye,
  EyeOff,
  Check,
  Loader2,
  PencilLine,
  type LucideIcon,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const KENYAN_COUNTIES = [
  'Nairobi', 'Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita-Taveta',
  'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru', 'Tharaka-Nithi',
  'Embu', 'Kitui', 'Machakos', 'Makueni', 'Nyandarua', 'Nyeri', 'Kirinyaga',
  "Murang'a", 'Kiambu', 'Turkana', 'West Pokot', 'Samburu', 'Trans Nzoia',
  'Uasin Gishu', 'Elgeyo-Marakwet', 'Nandi', 'Baringo', 'Laikipia', 'Nakuru',
  'Narok', 'Kajiado', 'Kericho', 'Bomet', 'Kakamega', 'Vihiga', 'Bungoma',
  'Busia', 'Siaya', 'Kisumu', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira', 'Other',
]

const SCHOOL_CATEGORIES = [
  { value: 'National', label: 'National', desc: 'Top-tier national school' },
  { value: 'County', label: 'County', desc: 'County-level school' },
  { value: 'Sub-County', label: 'Sub-County', desc: 'Local sub-county school' },
  { value: 'Private', label: 'Private', desc: 'Privately funded' },
  { value: 'International', label: 'International', desc: 'International curriculum' },
]

const EDUCATION_LEVELS = [
  { value: 'Pre-Primary', label: 'Pre-Primary', desc: 'PP1 – PP2 (CBE)' },
  { value: 'Primary', label: 'Primary', desc: 'Grade 1 – 6 (CBE)' },
  { value: 'Junior School', label: 'Junior School', desc: 'Grade 7 – 9 (CBE JSS)' },
  { value: 'Senior School', label: 'Senior School', desc: 'Grade 10 – 12 (CBE Pathways)' },
  { value: 'Secondary', label: 'Secondary (8-4-4)', desc: 'Form 1 – 4 (8-4-4)' },
  { value: 'University', label: 'University', desc: 'Higher education' },
  { value: 'Mixed', label: 'Mixed (Primary + Senior)', desc: 'Both primary and senior school' },
]

const GENDER_OPTIONS: { value: string; label: string; desc: string; icon: LucideIcon; tint: string }[] = [
  { value: 'Boys', label: 'Boys Only', desc: 'All-boys school', icon: Mars, tint: 'from-emerald-500 to-teal-600' },
  { value: 'Girls', label: 'Girls Only', desc: 'All-girls school', icon: Venus, tint: 'from-rose-500 to-pink-600' },
  { value: 'Mixed', label: 'Co-educational', desc: 'Boys and girls', icon: UsersIcon, tint: 'from-amber-500 to-orange-600' },
]

const PRESET_COLORS: { name: string; value: string }[] = [
  { name: 'Emerald', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Slate', value: '#64748b' },
]

const STEPS: { id: number; name: string; short: string; icon: LucideIcon }[] = [
  { id: 1, name: 'School Basics', short: 'Basics', icon: Building2 },
  { id: 2, name: 'School Type', short: 'Type', icon: GraduationCap },
  { id: 3, name: 'Gender & Location', short: 'Gender', icon: UsersIcon },
  { id: 4, name: 'School Identity', short: 'Identity', icon: Palette },
  { id: 5, name: 'Principal Account', short: 'Account', icon: User },
  { id: 6, name: 'Review & Submit', short: 'Review', icon: CheckCircle2 },
]

const TRUST_FEATURES = [
  { icon: Rocket, title: 'Instant setup', desc: 'Be up and running in under 2 minutes.' },
  { icon: ShieldCheck, title: 'Secure & isolated', desc: 'Encrypted passwords, single-tenant data.' },
  { icon: Sparkles, title: 'Pre-loaded curriculum', desc: 'Class levels & 15 default subjects seeded.' },
]

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

interface FormState {
  // Step 1 — Basics
  schoolName: string
  category: string
  schoolEmail: string
  schoolPhone: string
  // Step 2 — Type
  level: string
  knecCode: string
  yearEstablished: string
  // Step 3 — Gender & Location
  gender: string
  county: string
  address: string
  // Step 4 — Identity
  motto: string
  primaryColor: string
  // Step 5 — Principal account
  adminName: string
  adminEmail: string
  adminPhone: string
  password: string
  confirmPassword: string
}

const INITIAL: FormState = {
  schoolName: '',
  category: '',
  schoolEmail: '',
  schoolPhone: '',
  level: '',
  knecCode: '',
  yearEstablished: '',
  gender: '',
  county: '',
  address: '',
  motto: '',
  primaryColor: '#10b981',
  adminName: '',
  adminEmail: '',
  adminPhone: '',
  password: '',
  confirmPassword: '',
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function RegisterForm() {
  const { serverRegister, setAuthView } = useAuthStore()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [success, setSuccess] = useState<{
    schoolName: string
    slug: string
    schoolCode: string
  } | null>(null)

  const set = (k: keyof FormState) => (v: string) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const touch = (k: keyof FormState) =>
    setTouched(prev => ({ ...prev, [k]: true }))

  // ---- Validation ---------------------------------------------------------
  const errors = useMemo<Record<string, string>>(() => {
    const e: Record<string, string> = {}
    // Step 1
    if (!form.schoolName.trim()) e.schoolName = 'School name is required'
    else if (form.schoolName.trim().length < 2) e.schoolName = 'School name is too short'
    if (!form.category) e.category = 'Please select a category'
    if (form.schoolEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.schoolEmail))
      e.schoolEmail = 'Enter a valid email address'
    // Step 2
    if (!form.level) e.level = 'Please select an education level'
    if (form.yearEstablished) {
      const yr = Number(form.yearEstablished)
      const cur = new Date().getFullYear()
      if (!Number.isFinite(yr) || yr < 1800 || yr > cur)
        e.yearEstablished = `Enter a year between 1800 and ${cur}`
    }
    // Step 3
    if (!form.gender) e.gender = 'Please choose a gender type'
    if (!form.county) e.county = 'Please select a county'
    // Step 5
    if (!form.adminName.trim()) e.adminName = 'Administrator name is required'
    if (!form.adminEmail.trim()) e.adminEmail = 'Administrator email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail))
      e.adminEmail = 'Enter a valid email address'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Must be at least 6 characters'
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password'
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    return e
  }, [form])

  const STEP_KEYS: Record<number, (keyof FormState)[]> = {
    1: ['schoolName', 'category', 'schoolEmail'],
    2: ['level', 'yearEstablished'],
    3: ['gender', 'county'],
    4: [],
    5: ['adminName', 'adminEmail', 'password', 'confirmPassword'],
    6: [],
  }

  const stepErrors = (s: number): string[] =>
    STEP_KEYS[s].filter(k => errors[k as string]).map(k => errors[k as string])

  const isStepValid = (s: number) => stepErrors(s).length === 0

  const handleNext = () => {
    if (!isStepValid(step)) {
      const newTouched = { ...touched }
      STEP_KEYS[step].forEach(k => { newTouched[k as string] = true })
      setTouched(newTouched)
      const errs = stepErrors(step)
      if (errs.length) toast.error(errs[0])
      return
    }
    setDirection('forward')
    setStep(s => Math.min(6, s + 1))
  }

  const handleBack = () => {
    setDirection('back')
    setStep(s => Math.max(1, s - 1))
  }

  const goToStep = (s: number) => {
    // Only allow jumping to a step if all previous steps are valid
    for (let i = 1; i < s; i++) {
      if (!isStepValid(i)) {
        toast.error('Please complete previous steps first', {
          description: `Step ${i} needs your attention.`,
        })
        setStep(i)
        setDirection('back')
        return
      }
    }
    setDirection(s > step ? 'forward' : 'back')
    setStep(s)
  }

  const handleSubmit = async () => {
    // Validate all required steps
    for (const s of [1, 2, 3, 5]) {
      if (!isStepValid(s)) {
        setStep(s)
        setDirection('back')
        toast.error('Please complete this step before submitting', {
          description: `Step ${s} needs your attention.`,
        })
        return
      }
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
      adminPhone: form.adminPhone.trim(),
      level: form.level,
      knecCode: form.knecCode.trim(),
      yearEstablished: form.yearEstablished.trim(),
      category: form.category,
      gender: form.gender,
      motto: form.motto.trim(),
      primaryColor: form.primaryColor,
      address: form.address.trim(),
    }
    const result = await serverRegister(payload)
    setLoading(false)
    if (result.success && result.school) {
      toast.success('School registered successfully!', {
        description: 'Welcome to SkulHub — your 30-day trial is active.',
      })
      setSuccess({
        schoolName: result.school.name,
        slug: result.school.slug,
        schoolCode: result.school.schoolCode,
      })
    } else {
      toast.error('Registration failed', { description: result.error })
    }
  }

  // ---- Success screen -----------------------------------------------------
  if (success) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-teal-300/30 blur-3xl" />
        <Card className="relative z-10 w-full max-w-lg border-0 bg-card/80 shadow-2xl backdrop-blur-xl">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/40 animate-in zoom-in-50 duration-500">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Welcome aboard!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{success.schoolName}</span> is
              now registered on SkulHub. Your 30-day free trial is active.
            </p>

            <div className="mt-6 space-y-3">
              <div className="rounded-xl border bg-emerald-50/60 p-4 text-left dark:bg-emerald-950/20">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Your school code
                </p>
                <p className="mt-1 font-mono text-lg font-bold tracking-wider text-emerald-700 dark:text-emerald-400">
                  {success.schoolCode}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Share this with staff & parents to sign in.
                </p>
              </div>
              <div className="rounded-xl border bg-card/60 p-4 text-left">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  School URL slug
                </p>
                <p className="mt-1 break-all font-mono text-sm font-semibold text-foreground">
                  {success.slug}
                </p>
              </div>
            </div>

            <Button
              className="mt-6 w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              onClick={() => {
                setAuthView('login')
                setSuccess(null)
              }}
            >
              <Rocket className="mr-2 h-4 w-4" /> Enter Dashboard
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
              You&apos;re signed in. We&apos;ll take you to your dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ---- Step content animation class ---------------------------------------
  const animClass =
    direction === 'forward'
      ? 'animate-in fade-in-50 slide-in-from-right-8 duration-300'
      : 'animate-in fade-in-50 slide-in-from-left-8 duration-300'

  const progressPct = Math.round((step / 6) * 100)

  // ---- Main render --------------------------------------------------------
  return (
    <div className="relative flex min-h-screen w-full items-stretch justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950 sm:p-6 lg:p-8">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-teal-300/30 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-48 w-48 -translate-x-1/2 rounded-full bg-cyan-300/20 blur-3xl" />

      <div className="relative z-10 grid w-full max-w-6xl gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        {/* --------------------------------------------------------------- */}
        {/* Left: Branding + progress                                       */}
        {/* --------------------------------------------------------------- */}
        <div className="hidden flex-col justify-between rounded-3xl border border-white/40 bg-white/40 p-8 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 lg:flex">
          <div>
            <button
              type="button"
              onClick={() => setAuthView('login')}
              className="mb-8 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to login
            </button>

            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/30">
                <School className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">SkulHub</h1>
                <p className="text-xs text-muted-foreground">School Management System</p>
              </div>
            </div>

            <h2 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
              Register Your School
            </h2>
            <p className="mb-8 max-w-sm text-sm text-muted-foreground">
              Set up your institution in 6 quick steps. No credit card required —
              start your 30-day free trial with full access to 30+ modules.
            </p>

            {/* Progress block */}
            <div className="mb-8">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                  Step {step} of 6
                </span>
                <span className="font-medium text-muted-foreground">{progressPct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">
                {STEPS[step - 1].name}
              </p>
              <p className="text-xs text-muted-foreground">
                {step === 1 && 'Tell us about your school.'}
                {step === 2 && 'What kind of school is this?'}
                {step === 3 && 'Who does your school serve, and where?'}
                {step === 4 && 'Make your school portal feel like yours.'}
                {step === 5 && 'Create your principal / admin account.'}
                {step === 6 && 'Confirm everything looks right, then launch.'}
              </p>
            </div>

            <div className="space-y-3">
              {TRUST_FEATURES.map(f => (
                <div key={f.title} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
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

          <div className="mt-8 rounded-2xl border border-emerald-200/50 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">Tip:</span>{' '}
              You can edit any step later from your dashboard settings.
            </p>
          </div>
        </div>

        {/* --------------------------------------------------------------- */}
        {/* Right: Wizard form                                              */}
        {/* --------------------------------------------------------------- */}
        <Card className="flex flex-col border-0 bg-card/80 shadow-2xl backdrop-blur-xl">
          <CardContent className="flex flex-1 flex-col p-5 sm:p-6 lg:p-8">
            {/* Mobile branding + back */}
            <div className="mb-4 flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <School className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold">SkulHub</span>
              </div>
              <button
                type="button"
                onClick={() => setAuthView('login')}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Login
              </button>
            </div>

            {/* Stepper */}
            <Stepper step={step} onJump={goToStep} isStepValid={isStepValid} />

            {/* Step heading */}
            <div className="mb-5 mt-5">
              <h3 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {STEPS[step - 1].name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {step === 1 && 'Start with the basics about your school.'}
                {step === 2 && 'Tell us the education level and official codes.'}
                {step === 3 && 'Pick a gender type and your school location.'}
                {step === 4 && 'Add a personal touch to your school portal.'}
                {step === 5 && 'Create the master administrator account for this school.'}
                {step === 6 && 'Review your details, then start your free trial.'}
              </p>
            </div>

            {/* Step content (animated) */}
            <div className="flex-1">
              <div key={step} className={animClass}>
                {step === 1 && (
                  <Step1
                    form={form}
                    set={set}
                    touch={touch}
                    touched={touched}
                    errors={errors}
                  />
                )}
                {step === 2 && (
                  <Step2
                    form={form}
                    set={set}
                    touch={touch}
                    touched={touched}
                    errors={errors}
                  />
                )}
                {step === 3 && (
                  <Step3
                    form={form}
                    set={set}
                    touch={touch}
                    touched={touched}
                    errors={errors}
                  />
                )}
                {step === 4 && <Step4 form={form} set={set} touch={touch} />}
                {step === 5 && (
                  <Step5
                    form={form}
                    set={set}
                    touch={touch}
                    touched={touched}
                    errors={errors}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                  />
                )}
                {step === 6 && <Step6 form={form} onEdit={goToStep} />}
              </div>
            </div>

            {/* Navigation */}
            <div className="mt-6 flex items-center justify-between gap-3 border-t pt-5">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                  className="gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="hidden sm:inline">
                  {step < 6 ? `Next: ${STEPS[step].name}` : 'Ready to launch'}
                </span>
              </div>

              {step < 6 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Creating account...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Start Free Trial
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Sign in link */}
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setAuthView('login')}
                className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
              >
                Sign in
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stepper
// ---------------------------------------------------------------------------

function Stepper({
  step,
  onJump,
  isStepValid,
}: {
  step: number
  onJump: (s: number) => void
  isStepValid: (s: number) => boolean
}) {
  return (
    <div className="flex items-center justify-between gap-1">
      {STEPS.map((s, idx) => {
        const completed = step > s.id
        const current = step === s.id
        const reachable = s.id <= step || isStepValid(s.id - 1)
        const StepIcon = s.icon

        return (
          <div key={s.id} className="flex flex-1 items-center">
            {/* Node */}
            <button
              type="button"
              onClick={() => reachable && onJump(s.id)}
              disabled={!reachable}
              className={cn(
                'group relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all',
                current &&
                  'border-emerald-500 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30',
                completed &&
                  'border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600',
                !current && !completed &&
                  'border-border bg-card text-muted-foreground',
                reachable && !current && 'cursor-pointer hover:border-emerald-400',
                !reachable && 'cursor-not-allowed opacity-60',
              )}
              aria-label={`Step ${s.id}: ${s.name}`}
            >
              {completed ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
              {/* Tooltip with step name on hover */}
              <span className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-[10px] font-medium text-background shadow-md group-hover:block">
                {s.name}
              </span>
            </button>

            {/* Connector */}
            {idx < STEPS.length - 1 && (
              <div className="relative mx-1 h-0.5 flex-1 overflow-hidden rounded-full bg-border">
                <div
                  className={cn(
                    'absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500',
                    step > s.id ? 'w-full' : 'w-0',
                  )}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Field helpers
// ---------------------------------------------------------------------------

interface StepProps {
  form: FormState
  set: (k: keyof FormState) => (v: string) => void
  touch: (k: keyof FormState) => void
  touched: Record<string, boolean>
  errors: Record<string, string>
}

function FieldError({ show, msg }: { show: boolean; msg?: string }) {
  if (!show || !msg) return null
  return <p className="mt-1 text-xs font-medium text-rose-600">{msg}</p>
}

function IconInput({
  icon: Icon,
  className,
  ...props
}: React.ComponentProps<'input'> & { icon: LucideIcon }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input className={cn('pl-9', className)} {...props} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 1 — School Basics
// ---------------------------------------------------------------------------

function Step1({ form, set, touch, touched, errors }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="schoolName">
          School Name <span className="text-rose-500">*</span>
        </Label>
        <IconInput
          id="schoolName"
          icon={School}
          value={form.schoolName}
          onChange={e => {
            set('schoolName')(e.target.value)
            touch('schoolName')
          }}
          onBlur={() => touch('schoolName')}
          placeholder="e.g. St. Mary's Academy"
          aria-invalid={touched.schoolName && !!errors.schoolName}
        />
        <FieldError show={!!touched.schoolName} msg={errors.schoolName} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">
          School Category <span className="text-rose-500">*</span>
        </Label>
        <Select
          value={form.category}
          onValueChange={v => {
            set('category')(v)
            touch('category')
          }}
        >
          <SelectTrigger
            id="category"
            className="w-full"
            aria-invalid={touched.category && !!errors.category}
          >
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Select a category" />
            </span>
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {SCHOOL_CATEGORIES.map(c => (
              <SelectItem key={c.value} value={c.value}>
                <div className="flex flex-col">
                  <span className="font-medium">{c.label}</span>
                  <span className="text-xs text-muted-foreground">{c.desc}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError show={!!touched.category} msg={errors.category} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="schoolEmail">School Email</Label>
          <IconInput
            id="schoolEmail"
            icon={Mail}
            type="email"
            value={form.schoolEmail}
            onChange={e => set('schoolEmail')(e.target.value)}
            onBlur={() => touch('schoolEmail')}
            placeholder="info@school.ac.ke"
            aria-invalid={touched.schoolEmail && !!errors.schoolEmail}
          />
          <FieldError show={!!touched.schoolEmail} msg={errors.schoolEmail} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="schoolPhone">School Phone</Label>
          <IconInput
            id="schoolPhone"
            icon={Phone}
            value={form.schoolPhone}
            onChange={e => set('schoolPhone')(e.target.value)}
            placeholder="0712 345 678"
          />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 2 — School Type
// ---------------------------------------------------------------------------

function Step2({ form, set, touch, touched, errors }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="level">
          Education Level <span className="text-rose-500">*</span>
        </Label>
        <Select
          value={form.level}
          onValueChange={v => {
            set('level')(v)
            touch('level')
          }}
        >
          <SelectTrigger
            id="level"
            className="w-full"
            aria-invalid={touched.level && !!errors.level}
          >
            <span className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Select an education level" />
            </span>
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {EDUCATION_LEVELS.map(l => (
              <SelectItem key={l.value} value={l.value}>
                <div className="flex flex-col">
                  <span className="font-medium">{l.label}</span>
                  <span className="text-xs text-muted-foreground">{l.desc}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError show={!!touched.level} msg={errors.level} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="knecCode">KNEC Code</Label>
          <IconInput
            id="knecCode"
            icon={Hash}
            value={form.knecCode}
            onChange={e => set('knecCode')(e.target.value)}
            placeholder="e.g. 12345678901"
          />
          <p className="text-xs text-muted-foreground">
            Optional — used in KNEC exam submissions.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="yearEstablished">Year Established</Label>
          <IconInput
            id="yearEstablished"
            icon={CalendarDays}
            type="number"
            inputMode="numeric"
            min={1800}
            max={new Date().getFullYear()}
            value={form.yearEstablished}
            onChange={e => {
              set('yearEstablished')(e.target.value)
              touch('yearEstablished')
            }}
            onBlur={() => touch('yearEstablished')}
            placeholder="e.g. 1998"
            aria-invalid={touched.yearEstablished && !!errors.yearEstablished}
          />
          <FieldError show={!!touched.yearEstablished} msg={errors.yearEstablished} />
        </div>
      </div>

      {form.level && (
        <div className="rounded-xl border border-emerald-200/50 bg-emerald-50/60 p-4 text-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <p className="flex items-start gap-2 text-emerald-800 dark:text-emerald-300">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              We&apos;ll auto-create class levels for{' '}
              <span className="font-semibold">{form.level}</span> — e.g.{' '}
              {form.level === 'Pre-Primary' && 'PP1 and PP2'}
              {form.level === 'Primary' && 'Grade 1 through Grade 6'}
              {form.level === 'Junior School' && 'Grade 7 through Grade 9'}
              {form.level === 'Senior School' && 'Grade 10 through Grade 12'}
              {form.level === 'Secondary' && 'Form 1 through Form 4'}
              {form.level === 'University' && 'default year-of-study streams'}
              {form.level === 'Mixed' && 'Grade 1 – 12 (CBE full pathway)'}
              . You can customize them later.
            </span>
          </p>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 3 — Gender & Location
// ---------------------------------------------------------------------------

function Step3({ form, set, touch, touched, errors }: StepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>
          Gender <span className="text-rose-500">*</span>
        </Label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {GENDER_OPTIONS.map(opt => {
            const selected = form.gender === opt.value
            const OptIcon = opt.icon
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  set('gender')(opt.value)
                  touch('gender')
                }}
                className={cn(
                  'group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all',
                  selected
                    ? 'border-emerald-500 bg-emerald-50/60 shadow-md shadow-emerald-500/10 dark:bg-emerald-950/20'
                    : 'border-border bg-card/40 hover:border-emerald-300 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10',
                )}
              >
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform',
                    opt.tint,
                    selected ? 'scale-110' : 'group-hover:scale-105',
                  )}
                >
                  <OptIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
                {selected && (
                  <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
        <FieldError show={!!touched.gender} msg={errors.gender} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="county">
          County <span className="text-rose-500">*</span>
        </Label>
        <Select
          value={form.county}
          onValueChange={v => {
            set('county')(v)
            touch('county')
          }}
        >
          <SelectTrigger
            id="county"
            className="w-full"
            aria-invalid={touched.county && !!errors.county}
          >
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Select county" />
            </span>
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {KENYAN_COUNTIES.map(c => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError show={!!touched.county} msg={errors.county} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={form.address}
          onChange={e => set('address')(e.target.value)}
          placeholder="P.O. Box 12345 – 00100, Nairobi"
          rows={3}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Optional — postal address or physical location.
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 4 — School Identity
// ---------------------------------------------------------------------------

function Step4({
  form,
  set,
  touch,
}: {
  form: FormState
  set: (k: keyof FormState) => (v: string) => void
  touch: (k: keyof FormState) => void
}) {
  return (
    <div className="space-y-5">
      {/* Logo upload placeholder */}
      <div className="space-y-2">
        <Label>School Logo</Label>
        <div className="flex items-center gap-4">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 text-center dark:border-emerald-800 dark:bg-emerald-950/20"
            style={{ boxShadow: `inset 0 0 0 2px ${form.primaryColor}15` }}
          >
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Upload className="h-5 w-5" />
              <span className="text-[10px] font-medium">PNG / SVG</span>
            </div>
          </div>
          <div className="flex-1">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50/60 px-3 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
            >
              <Upload className="h-4 w-4" /> Upload Logo
            </button>
            <p className="mt-1 text-xs text-muted-foreground">
              Square image, at least 256×256 px. You can add this later in settings.
            </p>
          </div>
        </div>
      </div>

      {/* Motto */}
      <div className="space-y-2">
        <Label htmlFor="motto">School Motto</Label>
        <div className="relative">
          <Quote className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="motto"
            value={form.motto}
            onChange={e => {
              set('motto')(e.target.value)
              touch('motto')
            }}
            placeholder="e.g. Strive for Excellence"
            className="pl-9"
          />
        </div>
      </div>

      {/* Primary color */}
      <div className="space-y-3">
        <div>
          <Label>Primary Color</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Used across your portal for buttons, badges, and accents.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_COLORS.map(c => {
            const selected = form.primaryColor.toLowerCase() === c.value.toLowerCase()
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => set('primaryColor')(c.value)}
                title={c.name}
                className={cn(
                  'relative h-10 w-10 rounded-full transition-all',
                  selected
                    ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110'
                    : 'hover:scale-105 ring-1 ring-border',
                )}
                style={{ backgroundColor: c.value }}
              >
                {selected && (
                  <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
                )}
              </button>
            )
          })}
          {/* Custom color picker */}
          <div className="relative ml-1 flex items-center gap-2">
            <label
              htmlFor="customColor"
              className="flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <span
                className="h-5 w-5 rounded-full border border-border"
                style={{ backgroundColor: form.primaryColor }}
              />
              Custom
            </label>
            <input
              id="customColor"
              type="color"
              value={form.primaryColor}
              onChange={e => set('primaryColor')(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>
        </div>

        {/* Preview tile */}
        <div className="mt-4 rounded-2xl border bg-card/40 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Live preview
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg"
              style={{ backgroundColor: form.primaryColor }}
            >
              <School className="h-6 w-6" />
            </div>
            <div className="flex flex-col gap-1">
              <span
                className="rounded-md px-3 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: form.primaryColor }}
              >
                Primary Button
              </span>
              <span
                className="rounded-md border px-3 py-1 text-xs font-semibold"
                style={{
                  color: form.primaryColor,
                  borderColor: `${form.primaryColor}50`,
                  backgroundColor: `${form.primaryColor}10`,
                }}
              >
                Soft Badge
              </span>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">Hex</p>
              <p className="font-mono text-sm font-semibold uppercase text-foreground">
                {form.primaryColor}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 5 — Principal Account
// ---------------------------------------------------------------------------

function Step5({
  form,
  set,
  touch,
  touched,
  errors,
  showPassword,
  setShowPassword,
}: StepProps & {
  showPassword: boolean
  setShowPassword: (v: boolean) => void
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-emerald-50/40 p-3 dark:bg-emerald-950/15">
        <p className="flex items-center gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="h-4 w-4" />
          This account becomes the school&apos;s principal administrator with full access.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="adminName">
            Administrator Name <span className="text-rose-500">*</span>
          </Label>
          <IconInput
            id="adminName"
            icon={User}
            value={form.adminName}
            onChange={e => {
              set('adminName')(e.target.value)
              touch('adminName')
            }}
            onBlur={() => touch('adminName')}
            placeholder="e.g. Jane Wanjiru"
            aria-invalid={touched.adminName && !!errors.adminName}
          />
          <FieldError show={!!touched.adminName} msg={errors.adminName} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="adminEmail">
            Administrator Email <span className="text-rose-500">*</span>
          </Label>
          <IconInput
            id="adminEmail"
            icon={Mail}
            type="email"
            value={form.adminEmail}
            onChange={e => {
              set('adminEmail')(e.target.value)
              touch('adminEmail')
            }}
            onBlur={() => touch('adminEmail')}
            placeholder="admin@school.ac.ke"
            aria-invalid={touched.adminEmail && !!errors.adminEmail}
          />
          <FieldError show={!!touched.adminEmail} msg={errors.adminEmail} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="adminPhone">Administrator Phone</Label>
        <IconInput
          id="adminPhone"
          icon={Phone}
          value={form.adminPhone}
          onChange={e => set('adminPhone')(e.target.value)}
          placeholder="0712 345 678"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">
            Password <span className="text-rose-500">*</span>
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={e => {
                set('password')(e.target.value)
                touch('password')
              }}
              onBlur={() => touch('password')}
              placeholder="Min 6 characters"
              className="pl-9 pr-16"
              aria-invalid={touched.password && !!errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <FieldError show={!!touched.password} msg={errors.password} />
          {/* Password strength meter */}
          {form.password.length > 0 && (
            <PasswordStrength value={form.password} />
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">
            Confirm Password <span className="text-rose-500">*</span>
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={e => {
                set('confirmPassword')(e.target.value)
                touch('confirmPassword')
              }}
              onBlur={() => touch('confirmPassword')}
              placeholder="Re-enter password"
              className={cn(
                'pl-9',
                touched.confirmPassword && errors.confirmPassword &&
                  'border-rose-400 focus-visible:ring-rose-400',
              )}
              aria-invalid={touched.confirmPassword && !!errors.confirmPassword}
            />
            {form.confirmPassword.length > 0 && !errors.confirmPassword && (
              <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
            )}
          </div>
          <FieldError show={!!touched.confirmPassword} msg={errors.confirmPassword} />
        </div>
      </div>
    </div>
  )
}

function PasswordStrength({ value }: { value: string }) {
  const score = useMemo(() => {
    let s = 0
    if (value.length >= 6) s++
    if (value.length >= 10) s++
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) s++
    if (/\d/.test(value)) s++
    if (/[^a-zA-Z0-9]/.test(value)) s++
    return Math.min(4, s)
  }, [value])

  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = [
    'bg-rose-500',
    'bg-rose-500',
    'bg-amber-500',
    'bg-teal-500',
    'bg-emerald-500',
  ]
  const textColors = [
    'text-rose-600',
    'text-rose-600',
    'text-amber-600',
    'text-teal-600',
    'text-emerald-600',
  ]

  return (
    <div className="mt-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              i < score ? colors[score] : 'bg-border',
            )}
          />
        ))}
      </div>
      <p className={cn('mt-1 text-xs font-medium', textColors[score])}>
        {labels[score]}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 6 — Review & Submit
// ---------------------------------------------------------------------------

function Step6({
  form,
  onEdit,
}: {
  form: FormState
  onEdit: (s: number) => void
}) {
  const sections: {
    step: number
    title: string
    icon: LucideIcon
    rows: { label: string; value: string }[]
  }[] = [
    {
      step: 1,
      title: 'School Basics',
      icon: Building2,
      rows: [
        { label: 'School Name', value: form.schoolName || '—' },
        { label: 'Category', value: form.category || '—' },
        { label: 'School Email', value: form.schoolEmail || '—' },
        { label: 'School Phone', value: form.schoolPhone || '—' },
      ],
    },
    {
      step: 2,
      title: 'School Type',
      icon: GraduationCap,
      rows: [
        { label: 'Education Level', value: form.level || '—' },
        { label: 'KNEC Code', value: form.knecCode || '—' },
        { label: 'Year Established', value: form.yearEstablished || '—' },
      ],
    },
    {
      step: 3,
      title: 'Gender & Location',
      icon: UsersIcon,
      rows: [
        { label: 'Gender', value: form.gender || '—' },
        { label: 'County', value: form.county || '—' },
        { label: 'Address', value: form.address || '—' },
      ],
    },
    {
      step: 4,
      title: 'School Identity',
      icon: Palette,
      rows: [
        { label: 'Motto', value: form.motto || '—' },
        { label: 'Primary Color', value: form.primaryColor.toUpperCase() },
      ],
    },
    {
      step: 5,
      title: 'Principal Account',
      icon: User,
      rows: [
        { label: 'Administrator Name', value: form.adminName || '—' },
        { label: 'Administrator Email', value: form.adminEmail || '—' },
        { label: 'Administrator Phone', value: form.adminPhone || '—' },
      ],
    },
  ]

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Please review your details below. Click any section to edit it.
      </p>

      <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
        {sections.map(sec => {
          const SecIcon = sec.icon
          return (
            <div
              key={sec.step}
              className="rounded-2xl border bg-card/60 p-4 transition-colors hover:border-emerald-300 dark:hover:border-emerald-800"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <SecIcon className="h-4 w-4" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">{sec.title}</h4>
                </div>
                <button
                  type="button"
                  onClick={() => onEdit(sec.step)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                >
                  <PencilLine className="h-3 w-3" /> Edit
                </button>
              </div>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                {sec.rows.map(row => (
                  <div key={row.label} className="flex flex-col">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {row.label}
                    </dt>
                    <dd className="break-words font-medium text-foreground">
                      {row.label === 'Primary Color' ? (
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="inline-block h-4 w-4 rounded-full border border-border"
                            style={{ backgroundColor: form.primaryColor }}
                          />
                          {row.value}
                        </span>
                      ) : (
                        row.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )
        })}
      </div>

      {/* Trial callout */}
      <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 dark:border-emerald-900/40 dark:from-emerald-950/30 dark:to-teal-950/30">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              30-day free trial — no credit card required
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Full access to all 30+ modules. We&apos;ll auto-create your class levels,
              15 default subjects, and 9 departments so you can start on day one.
            </p>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        By registering, you agree to SkulHub&apos;s{' '}
        <span className="font-medium text-foreground">Terms of Service</span> and{' '}
        <span className="font-medium text-foreground">Privacy Policy</span>.
      </p>
    </div>
  )
}
