'use client'
import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import {
  motion,
  useInView,
  AnimatePresence,
  useReducedMotion,
  animate,
} from 'framer-motion'
import { useAuthStore } from '@/lib/auth-store'
import { ConversionOptimizer } from '@/components/conversion-optimizer'
import { getVariant, trackConversion } from '@/lib/ab-testing'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  School,
  Users,
  GraduationCap,
  BookOpen,
  Wallet,
  CalendarCheck,
  Library,
  Bus,
  HeartPulse,
  Megaphone,
  Scale,
  Home,
  Package,
  UtensilsCrossed,
  ClipboardCheck,
  FileText,
  BarChart3,
  Settings,
  ArrowRight,
  Check,
  Smartphone,
  Shield,
  Zap,
  Clock,
  Star,
  ChevronDown,
  ChevronRight,
  Building2,
  Phone,
  Mail,
  MapPin,
  Play,
  X,
  Send,
  MessageSquare,
  TrendingUp,
  PieChart,
  Users2,
  DollarSign,
  Menu,
  BellRing,
  CreditCard,
  Receipt,
  Loader2,
  CheckCircle2,
  Sparkles,
  Quote,
  Lock,
} from 'lucide-react'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Static content constants
// ---------------------------------------------------------------------------

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#modules', label: 'Modules' },
  { href: '#mpesa', label: 'M-Pesa' },
  { href: '#ai-demo', label: 'Smart Reports' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
  { href: '#contact', label: 'Contact' },
] as const

const MODULES = [
  { name: 'Dashboard', icon: BarChart3, desc: 'Real-time school overview' },
  { name: 'Students', icon: Users, desc: 'Admissions & profiles' },
  { name: 'Staff', icon: GraduationCap, desc: 'Teachers & support staff' },
  { name: 'Academics', icon: BookOpen, desc: 'Classes, subjects, exams' },
  { name: 'Attendance', icon: CalendarCheck, desc: 'Daily tracking & reports' },
  { name: 'Finance & Fees', icon: Wallet, desc: 'Invoices & M-Pesa payments' },
  { name: 'Report Cards', icon: FileText, desc: 'CBE-style printable reports' },
  { name: 'Health & Wellness', icon: HeartPulse, desc: 'Medical records & clinic' },
  { name: 'Discipline', icon: Scale, desc: 'Incidents & sanctions' },
  { name: 'Hostel & Boarding', icon: Home, desc: 'Dormitories & beds' },
  { name: 'Communications', icon: Megaphone, desc: 'Announcements & SMS' },
  { name: 'Library', icon: Library, desc: 'Books & borrowing' },
  { name: 'Transport', icon: Bus, desc: 'Routes & vehicles' },
  { name: 'Cafeteria & Meals', icon: UtensilsCrossed, desc: 'Menu & dining' },
  { name: 'Payroll', icon: Wallet, desc: 'Staff salaries & payslips' },
  { name: 'Procurement', icon: Package, desc: 'Suppliers & purchase orders' },
  { name: 'Examinations', icon: ClipboardCheck, desc: 'Question banks & CATs' },
  { name: 'Inventory', icon: Package, desc: 'Assets & maintenance' },
  { name: 'Events', icon: CalendarCheck, desc: 'Calendar & activities' },
  { name: 'Alumni', icon: Users, desc: 'Graduates & donations' },
  { name: 'Parent Portal', icon: Smartphone, desc: 'Parents check fees & grades' },
  { name: 'Staff Room Board', icon: Building2, desc: 'Live display screen' },
  { name: 'ID Cards', icon: FileText, desc: 'Printable student/staff IDs' },
  { name: 'Feedback', icon: Star, desc: 'Surveys & ratings' },
  { name: 'Visitors & Gate', icon: Shield, desc: 'Security & visitor tracking' },
  { name: 'Facility Booking', icon: Building2, desc: 'Halls, labs, grounds' },
  { name: 'Lesson Plans', icon: BookOpen, desc: 'Schemes of work' },
  { name: 'Homework', icon: FileText, desc: 'Assignments tracking' },
  { name: 'Appraisals', icon: Star, desc: 'Staff performance reviews' },
  { name: 'Data Import', icon: Package, desc: 'Bulk migrate existing data' },
  { name: 'Inventory Requests', icon: Package, desc: 'Staff request items from store' },
  { name: 'Settings', icon: Settings, desc: 'System configuration' },
] as const

const FEATURES = [
  {
    icon: Shield,
    title: 'Secure & Role-Based',
    desc: '13 staff roles with granular permissions. Teachers never see financial data.',
  },
  {
    icon: Smartphone,
    title: 'Parent Portal',
    desc: 'Parents check fees, grades, and attendance from their phone — no login needed.',
  },
  {
    icon: Zap,
    title: 'M-Pesa Ready',
    desc: 'Record payments via M-Pesa Paybill 522522. Invoices auto-update.',
  },
  {
    icon: Clock,
    title: 'Live Dashboard',
    desc: 'Real-time clock, attendance trends, fee collection rates, and announcements.',
  },
  {
    icon: Building2,
    title: 'Multi-School',
    desc: 'Each school gets isolated data. Register unlimited schools on one platform.',
  },
  {
    icon: FileText,
    title: 'CBE Compliant',
    desc: "Full support for Kenya's Competency-Based Education (Grade 1-12) and 8-4-4 (Form 1-4).",
  },
] as const

const MODULE_TABS = [
  {
    id: 'academics',
    label: 'Academics',
    icon: BookOpen,
    blurb: 'CBE (Grade 1-12) & 8-4-4 (Form 1-4). Subjects, CATs, report cards, and grade analytics in one place.',
    features: [
      'CBE & 8-4-4 curriculum support',
      'Exam scheduling & CATs',
      'Auto-generated report cards',
      'Grade & stream analytics',
    ],
    chart: [40, 65, 50, 80, 60, 90, 70],
    chartLabel: 'Avg score per subject',
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: Wallet,
    blurb: 'Invoices, M-Pesa payments, receipts, and payroll — all reconciled automatically.',
    features: [
      'Invoice generation & tracking',
      'M-Pesa Paybill 522522 integration',
      'Auto-reconciliation of payments',
      'Staff payroll & payslips',
    ],
    chart: [30, 55, 70, 60, 85, 95, 75],
    chartLabel: 'Fee collection (KES k)',
    accent: 'from-teal-500 to-cyan-500',
  },
  {
    id: 'health',
    label: 'Health',
    icon: HeartPulse,
    blurb: 'Medical records, clinic visits, vaccinations, and allergies — secure and instantly accessible.',
    features: [
      'Student medical records',
      'Clinic visit logging',
      'Vaccination tracking',
      'Allergy & condition alerts',
    ],
    chart: [20, 35, 30, 45, 25, 40, 50],
    chartLabel: 'Clinic visits / week',
    accent: 'from-cyan-500 to-emerald-500',
  },
  {
    id: 'transport',
    label: 'Transport',
    icon: Bus,
    blurb: 'Routes, vehicles, drivers, and trip tracking — keep every student safe on the road.',
    features: [
      'Route & stop management',
      'Vehicle & driver records',
      'Trip attendance scanning',
      'Parent pickup alerts',
    ],
    chart: [50, 60, 45, 70, 55, 80, 65],
    chartLabel: 'Students transported / day',
    accent: 'from-emerald-500 to-cyan-500',
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: Megaphone,
    blurb: 'SMS, announcements, and parent portal notifications — reach every parent in seconds.',
    features: [
      'Bulk SMS to parents',
      'School announcements feed',
      'Event & calendar sharing',
      'Parent portal notifications',
    ],
    chart: [10, 40, 25, 60, 35, 75, 90],
    chartLabel: 'Messages sent / week',
    accent: 'from-teal-500 to-emerald-500',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    blurb: 'Real-time dashboards: attendance trends, fee collection, and performance insights at a glance.',
    features: [
      'Live attendance trends',
      'Fee collection rate monitor',
      'Performance analytics',
      'Exportable reports',
    ],
    chart: [60, 70, 55, 85, 75, 95, 90],
    chartLabel: 'Collection rate %',
    accent: 'from-emerald-500 to-teal-500',
  },
] as const

const PLANS = [
  {
    name: 'Starter',
    price: '2,500',
    period: '/month',
    students: 'Up to 200 students',
    features: ['All 33+ modules', '5 user accounts', 'Parent portal', 'Email support'],
    popular: false,
  },
  {
    name: 'Standard',
    price: '5,000',
    period: '/month',
    students: 'Up to 1,000 students',
    features: [
      'Everything in Starter',
      '20 user accounts',
      'SMS notifications',
      'Priority support',
      'Data migration included',
    ],
    popular: true,
  },
  {
    name: 'Premium',
    price: '10,000',
    period: '/month',
    students: 'Unlimited students',
    features: [
      'Everything in Standard',
      'Unlimited users',
      'M-Pesa integration',
      'Dedicated support',
      'Custom branding',
      'API access',
    ],
    popular: false,
  },
] as const

const TESTIMONIALS = [
  {
    quote: 'SkulHub reduced our fee collection time from 2 weeks to 2 days.',
    role: 'Principal',
    school: 'Bright Future Academy, Nairobi',
    initials: 'BA',
  },
  {
    quote: 'The parent portal eliminated our diary costs completely.',
    role: 'Deputy Principal',
    school: 'Riverside School, Mombasa',
    initials: 'RS',
  },
  {
    quote: 'M-Pesa integration is a game-changer. Parents pay instantly.',
    role: 'Bursar',
    school: 'Greenfield High, Kisumu',
    initials: 'GH',
  },
] as const

const FAQS = [
  {
    q: 'What is SkulHub?',
    a: 'SkulHub is a complete school management system built for Kenyan schools. It bundles 33+ modules — students, academics, finance, health, transport, communication, and analytics — into one secure, role-based platform accessible from any device.',
  },
  {
    q: 'Is SkulHub CBE compliant?',
    a: "Yes. SkulHub fully supports Kenya's Competency-Based Education (CBE) curriculum for Grade 1 through Grade 12, alongside the legacy 8-4-4 system (Form 1-4). Report cards, grading, and learning areas adapt to whichever curriculum your school follows.",
  },
  {
    q: 'How does the M-Pesa integration work?',
    a: 'Parents pay school fees via M-Pesa Paybill 522522 using the student invoice number. SkulHub automatically reconciles incoming payments against outstanding invoices, updates the student balance in real time, and issues an instant receipt — no manual data entry required.',
  },
  {
    q: 'Can parents access the portal without logging in?',
    a: 'Yes. The parent portal lets parents check fees, grades, and attendance from their phone using a simple link — no password to remember. For sensitive actions, a one-time SMS code confirms identity.',
  },
  {
    q: 'How many schools can I manage on one account?',
    a: 'Unlimited. Each school you register gets fully isolated data, its own staff accounts, and independent billing. A super-admin dashboard lets you compare schools side by side.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes — every school starts with a 30-day free trial. No credit card required. You get full access to all 33+ modules, sample data, and M-Pesa simulation so you can evaluate the platform end-to-end before paying.',
  },
  {
    q: 'What staff roles are available?',
    a: 'SkulHub ships with 13 pre-configured staff roles — Principal, Deputy Principal, Bursar, Registrar, Teacher, Head of Department, Librarian, Nurse, Boarding Master, Transport Officer, Procurement Officer, Receptionist, and Super Admin — each with granular, role-based permissions.',
  },
  {
    q: 'Can I migrate my existing data into SkulHub?',
    a: 'Yes. Standard and Premium plans include guided data migration. Our team helps you bulk-import students, staff, classes, fee structures, and historical results from Excel or your previous system.',
  },
  {
    q: 'Is my school data secure?',
    a: 'Absolutely. Every school gets an isolated database, all traffic is encrypted in transit, and granular role-based access control means a teacher can never see financial data and a bursar can never see medical records. Daily backups keep your data safe.',
  },
  {
    q: 'What kind of support do you offer?',
    a: 'Starter plans include email support (response within 24 hours). Standard plans get priority support with SMS alerts and live chat. Premium plans get a dedicated account manager and same-day response on all requests.',
  },
] as const

const FLOATING_BADGES = [
  { label: 'CBE Compliant', icon: FileText, className: '-left-2 top-10 sm:-left-6' },
  { label: 'M-Pesa Ready', icon: Zap, className: '-right-2 top-24 sm:-right-8' },
  { label: '33+ Modules', icon: Package, className: 'right-12 -bottom-4 sm:right-20' },
] as const

// ---------------------------------------------------------------------------
// Helper hooks
// ---------------------------------------------------------------------------

/** Imperative count-up animation driven by framer-motion's `animate`. */
function useCountUp(target: number, start: boolean, duration = 1.6) {
  const [value, setValue] = useState(0)
  const reduce = useReducedMotion()
  useEffect(() => {
    if (!start) return
    // For reduced-motion users, run an effectively-instant animation so the
    // value snaps to target via the onUpdate callback (avoids a synchronous
    // setState in the effect body, which cascades renders).
    const d = reduce ? 0.05 : duration
    const controls = animate(0, target, {
      duration: d,
      ease: 'easeOut',
      onUpdate: (v) => setValue(v),
    })
    return () => controls.stop()
  }, [target, start, duration, reduce])
  return value
}

/**
 * Typewriter component — reveals `text` one character at a time.
 * Intentionally a component (not a hook) so callers can remount it via a
 * `key` prop to reset progress, keeping all setState calls inside the
 * interval callback (never synchronous in an effect body).
 */
function Typewriter({ text, speed = 18 }: { text: string; speed?: number }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let i = 0
    const id = window.setInterval(() => {
      i += 1
      setCount(i)
      if (i >= text.length) window.clearInterval(id)
    }, speed)
    return () => window.clearInterval(id)
  }, [text, speed])
  const done = count >= text.length
  return (
    <>
      {text.slice(0, count)}
      {!done && (
        <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-emerald-600 align-middle" />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Small reusable visual components
// ---------------------------------------------------------------------------

function CountUp({
  target,
  prefix = '',
  suffix = '',
  className,
  duration = 1.6,
}: {
  target: number
  prefix?: string
  suffix?: string
  className?: string
  duration?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const value = useCountUp(target, inView, duration)
  const display = target % 1 === 0 ? Math.round(value).toString() : value.toFixed(1)
  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  )
}

/** Card with a radial glow that follows the mouse cursor. */
function GlowCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--glow-x', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--glow-y', `${e.clientY - rect.top}px`)
  }
  return (
    <div
      onMouseMove={handleMove}
      className={cn('group relative overflow-hidden', className)}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(420px circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(16,185,129,0.18), transparent 65%)',
        }}
      />
      <div className="relative">{children}</div>
    </div>
  )
}

function BarChartMockup({
  data,
  accent = 'from-emerald-500 to-teal-500',
  className,
}: {
  data: readonly number[]
  accent?: string
  className?: string
}) {
  const max = Math.max(...data, 1)
  return (
    <div className={cn('flex h-20 items-end gap-1.5', className)}>
      {data.map((v, i) => (
        <motion.div
          key={`bar-${i}`}
          initial={{ height: 0 }}
          whileInView={{ height: `${(v / max) * 100}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
          className={cn('flex-1 rounded-t bg-gradient-to-t', accent)}
        />
      ))}
    </div>
  )
}

/** Mini glassmorphism dashboard mockup rendered inside the hero. */
function DashboardPreview() {
  const sidebarIcons = [BarChart3, Users, BookOpen, Wallet, HeartPulse, Bus]
  const statCards = [
    { label: 'Students', value: '426', icon: Users, color: 'text-emerald-600 bg-emerald-500/10' },
    { label: 'Collected', value: 'KES 145k', icon: Wallet, color: 'text-teal-600 bg-teal-500/10' },
    { label: 'Present', value: '94%', icon: CalendarCheck, color: 'text-cyan-600 bg-cyan-500/10' },
  ]
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/60 bg-white/80 dark:border-slate-700/60 dark:bg-slate-900/80">
      {/* Browser-style top bar */}
      <div className="flex items-center gap-2 border-b border-slate-200/60 bg-slate-50/80 px-4 py-2 dark:border-slate-700/60 dark:bg-slate-800/80">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="ml-2 hidden h-5 flex-1 items-center rounded bg-white/70 px-2 text-[9px] text-slate-400 dark:bg-slate-700/70 sm:flex">
          app.skulhub.co.ke/dashboard
        </div>
      </div>
      <div className="flex">
        {/* Mini sidebar */}
        <div className="hidden w-12 flex-col items-center gap-3 border-r border-slate-200/60 bg-slate-50/50 py-3 sm:flex dark:border-slate-700/60 dark:bg-slate-800/50">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <School className="h-3.5 w-3.5" />
          </div>
          {sidebarIcons.map((Icon, i) => (
            <div
              key={`side-${i}`}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors',
                i === 0 && 'bg-emerald-500/15 text-emerald-600',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>
          ))}
        </div>
        {/* Main panel */}
        <div className="flex-1 p-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="h-2.5 w-24 rounded bg-slate-300/70 dark:bg-slate-600/70" />
              <div className="mt-1 h-2 w-16 rounded bg-slate-200/70 dark:bg-slate-700/70" />
            </div>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
              <BellRing className="h-3 w-3" />
            </div>
          </div>
          <div className="mb-3 grid grid-cols-3 gap-2">
            {statCards.map((s) => {
              const Icon = s.icon
              return (
                <div
                  key={s.label}
                  className="rounded-lg border border-slate-200/60 bg-white/70 p-2 dark:border-slate-700/60 dark:bg-slate-800/70"
                >
                  <div className={cn('mb-1 flex h-5 w-5 items-center justify-center rounded', s.color)}>
                    <Icon className="h-2.5 w-2.5" />
                  </div>
                  <p className="text-[10px] font-bold">{s.value}</p>
                  <p className="text-[8px] text-slate-400">{s.label}</p>
                </div>
              )
            })}
          </div>
          <div className="rounded-lg border border-slate-200/60 bg-white/70 p-2 dark:border-slate-700/60 dark:bg-slate-800/70">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[8px] font-medium text-slate-500 dark:text-slate-400">
                Fee collection (7d)
              </span>
              <span className="text-[8px] font-semibold text-emerald-600">+18%</span>
            </div>
            <BarChartMockup data={[40, 65, 50, 80, 60, 90, 75]} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Container / item variants for staggered entrances
// ---------------------------------------------------------------------------

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const fadeUpItem = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
}

// ---------------------------------------------------------------------------
// Main LandingPage
// ---------------------------------------------------------------------------

export function LandingPage() {
  const { setAuthView } = useAuthStore()
  const [showVideo, setShowVideo] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar onCta={() => { trackConversion('nav_cta', heroVariant); setAuthView('register') }} onSignIn={() => setAuthView('login')} />

      <main className="flex-1">
        <Hero onCta={() => { trackConversion('hero_cta', heroVariant); setAuthView('register') }} onSignIn={() => setAuthView('login')} />
        <FeaturesSection />
        <ModuleShowcase />
        <MpesaDemo />
        <StatsBand />
        <Testimonials />
        <AiDemo />
        <FaqSection />
        <PricingSection onCta={() => { trackConversion('pricing_cta', 'A'); setAuthView('register') }} />
        <DemoVideoSection onPlay={() => setShowVideo(true)} />
        <FinalCta onCta={() => { trackConversion('final_cta', 'A'); setAuthView('register') }} onSignIn={() => setAuthView('login')} />
      </main>

      <Footer
        onRegister={() => setAuthView('register')}
        onLogin={() => setAuthView('login')}
        onStaffSignup={() => setAuthView('staff-signup')}
        onParent={() => setAuthView('parent')}
      />

      {/* Demo video modal — remounts each open so playback resets */}
      {showVideo && <DemoVideoModal key="demo-video" onClose={() => setShowVideo(false)} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Navigation — sticky, glassy, with mobile Sheet drawer
// ---------------------------------------------------------------------------

function Navbar({ onCta, onSignIn }: { onCta: () => void; onSignIn: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <nav className="sticky top-0 z-50 border-b border-emerald-500/10 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Brand */}
        <a href="#top" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
            <School className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">SkulHub</span>
        </a>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-emerald-600"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignIn}
            className="hidden sm:inline-flex"
          >
            Sign In
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={onCta}
          >
            Start Free Trial
          </Button>

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 max-w-[85vw]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <School className="h-4 w-4" />
                  </div>
                  SkulHub
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-4 flex flex-col gap-1 px-2">
                {NAV_LINKS.map((l) => (
                  <SheetClose asChild key={l.href}>
                    <a
                      href={l.href}
                      className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40"
                    >
                      {l.label}
                    </a>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2 px-4 pb-6">
                <SheetClose asChild>
                  <Button variant="outline" onClick={onSignIn}>
                    Sign In
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={onCta}
                  >
                    Start Free Trial
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}

// ---------------------------------------------------------------------------
// Hero — floating orbs, glassmorphism dashboard, count-up stats, badges
// ---------------------------------------------------------------------------

function Hero({ onCta, onSignIn }: { onCta: () => void; onSignIn: () => void }) {
  const reduce = useReducedMotion()
  const heroStats = [
    { target: 33, suffix: '+', label: 'Modules' },
    { target: 13, suffix: '', label: 'Staff Roles' },
    { target: 426, suffix: '', label: 'Demo Students' },
  ]

  return (
    <section id="top" className="relative overflow-hidden">
      {/* Floating gradient orbs */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-20 h-96 w-96 rounded-full bg-emerald-400/30 blur-3xl"
        animate={reduce ? {} : { y: [0, -40, 0], x: [0, 30, 0], scale: [1, 1.15, 1] }}
        transition={
          reduce
            ? { duration: 0 }
            : { duration: 14, repeat: Infinity, ease: 'easeInOut' }
        }
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-32 h-96 w-96 rounded-full bg-teal-400/30 blur-3xl"
        animate={reduce ? {} : { y: [0, 30, 0], x: [0, -25, 0], scale: [1, 1.1, 1] }}
        transition={
          reduce
            ? { duration: 0 }
            : { duration: 16, repeat: Infinity, ease: 'easeInOut' }
        }
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-400/25 blur-3xl"
        animate={reduce ? {} : { y: [0, -20, 0], scale: [1, 1.2, 1] }}
        transition={
          reduce
            ? { duration: 0 }
            : { duration: 12, repeat: Infinity, ease: 'easeInOut' }
        }
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-3xl text-center"
        >
          <motion.div variants={fadeUpItem}>
            <Badge
              variant="outline"
              className="mb-4 border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
            >
              <Sparkles className="mr-1.5 h-3 w-3" /> 33+ Modules · CBE (Grade 1-12) · M-Pesa Ready
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUpItem}
            className="text-4xl font-bold leading-tight tracking-tight md:text-6xl"
          >
            The complete school management system for{' '}
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Kenyan schools
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUpItem}
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
          >
            Students, academics, finance, health, transport, payroll, and more — all in one
            platform. Built for Kenya. Scalable worldwide. Start your 30-day free trial today.
          </motion.p>

          <motion.div
            variants={fadeUpItem}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button
              size="lg"
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
              onClick={onCta}
            >
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
              onClick={onSignIn}
            >
              View Demo
            </Button>
          </motion.div>

          <motion.p
            variants={fadeUpItem}
            className="mt-4 text-sm text-muted-foreground"
          >
            No credit card required · Setup in 2 minutes · Cancel anytime
          </motion.p>
        </motion.div>

        {/* Glassmorphism dashboard preview with floating badges */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: 'easeOut' }}
          className="relative mx-auto mt-16 max-w-4xl"
        >
          {/* Floating badges */}
          {FLOATING_BADGES.map((b, i) => {
            const Icon = b.icon
            return (
              <motion.div
                key={b.label}
                className={cn('absolute z-20', b.className)}
                animate={reduce ? {} : { y: [0, -10, 0] }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : {
                        duration: 4 + i,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: i * 0.4,
                      }
                }
              >
                <div className="flex items-center gap-1.5 rounded-full border border-white/30 bg-white/80 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-lg backdrop-blur-md dark:bg-slate-900/80 dark:text-emerald-400">
                  <Icon className="h-3.5 w-3.5" />
                  {b.label}
                </div>
              </motion.div>
            )
          })}

          <div className="rounded-2xl border border-white/20 bg-white/70 p-2 shadow-2xl backdrop-blur-xl dark:border-slate-700/40 dark:bg-slate-900/70">
            <DashboardPreview />
          </div>
        </motion.div>

        {/* Count-up stats */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-4"
        >
          {heroStats.map((s) => (
            <motion.div
              key={s.label}
              variants={fadeUpItem}
              className="rounded-xl border border-emerald-500/15 bg-white/60 p-4 text-center backdrop-blur-md dark:bg-slate-900/60"
            >
              <p className="text-2xl font-bold text-emerald-600 md:text-3xl">
                <CountUp target={s.target} suffix={s.suffix} />
              </p>
              <p className="mt-1 text-xs text-muted-foreground md:text-sm">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

function FeaturesSection() {
  return (
    <section id="features" className="border-t bg-muted/30 py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-12 text-center">
          <Badge
            variant="outline"
            className="mb-3 border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
          >
            Why SkulHub
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Why schools choose SkulHub
          </h2>
          <p className="mt-2 text-muted-foreground">
            Everything you need to run your school efficiently
          </p>
        </div>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <motion.div key={f.title} variants={fadeUpItem}>
                <GlowCard className="h-full rounded-2xl border border-emerald-500/10 bg-card/60 backdrop-blur-md transition-colors hover:border-emerald-400/40">
                  <CardContent className="p-6">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold">{f.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </GlowCard>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Modules grid (full 33+ list)
// ---------------------------------------------------------------------------

function ModulesGrid() {
  return (
    <section id="modules" className="py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-12 text-center">
          <Badge
            variant="outline"
            className="mb-3 border-teal-300 bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400"
          >
            Full Coverage
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            33+ Modules. One Platform.
          </h2>
          <p className="mt-2 text-muted-foreground">
            From admissions to alumni — every aspect of school management, covered
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {MODULES.map((m) => {
            const Icon = m.icon
            return (
              <div
                key={m.name}
                className="flex items-center gap-3 rounded-xl border border-emerald-500/10 bg-card/40 p-3 transition-colors hover:border-emerald-300 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{m.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{m.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Interactive Module Showcase — 6 tabs with mouse-follow glow
// ---------------------------------------------------------------------------

function ModuleShowcase() {
  const [active, setActive] = useState(0)
  const tab = MODULE_TABS[active]
  const Icon = tab.icon

  return (
    <>
      <ModulesGrid />
      <section className="border-t bg-gradient-to-b from-emerald-50/40 to-background py-20 dark:from-emerald-950/20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-10 text-center">
            <Badge
              variant="outline"
              className="mb-3 border-cyan-300 bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400"
            >
              Interactive Tour
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Explore the modules
            </h2>
            <p className="mt-2 text-muted-foreground">
              Hover a card to see the glow follow your cursor. Click a tab to switch.
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
            {MODULE_TABS.map((t, i) => {
              const TabIcon = t.icon
              const isActive = i === active
              return (
                <button
                  key={t.id}
                  onClick={() => setActive(i)}
                  className={cn(
                    'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all',
                    isActive
                      ? 'border-emerald-500 bg-emerald-600 text-white shadow-lg'
                      : 'border-emerald-500/20 bg-background/60 text-muted-foreground hover:border-emerald-400 hover:text-emerald-700',
                  )}
                >
                  <TabIcon className="h-4 w-4" />
                  {t.label}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <GlowCard className="rounded-2xl border border-emerald-500/15 bg-card/60 p-6 backdrop-blur-md md:p-8">
                <div className="grid gap-8 lg:grid-cols-2">
                  {/* Left: header + features */}
                  <div>
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-2xl font-bold">{tab.label}</h3>
                    </div>
                    <p className="mb-6 text-muted-foreground">{tab.blurb}</p>
                    <ul className="space-y-3">
                      {tab.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right: bar chart mockup */}
                  <div className="rounded-xl border border-emerald-500/15 bg-background/60 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        {tab.chartLabel}
                      </span>
                      <span className="text-xs font-semibold text-emerald-600">+18% MoM</span>
                    </div>
                    <BarChartMockup
                      data={tab.chart}
                      accent={tab.accent}
                      className="h-32"
                    />
                    <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                      <span>Sun</span>
                    </div>
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </>
  )
}

// ---------------------------------------------------------------------------
// Live M-Pesa Payment Demo — 4-stage animation
// ---------------------------------------------------------------------------

type MpesaStage = 'idle' | 'stk' | 'processing' | 'success'

function MpesaDemo() {
  const [stage, setStage] = useState<MpesaStage>('idle')
  const [running, setRunning] = useState(false)
  const timers = useRef<number[]>([])

  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  const simulate = () => {
    if (running) return
    setRunning(true)
    setStage('idle')
    // Stage 1 -> 2 (STK push)
    timers.current.push(window.setTimeout(() => setStage('stk'), 800))
    // Stage 2 -> 3 (processing)
    timers.current.push(window.setTimeout(() => setStage('processing'), 2200))
    // Stage 3 -> 4 (success)
    timers.current.push(window.setTimeout(() => {
      setStage('success')
      setRunning(false)
    }, 3800))
  }

  const reset = () => {
    clearTimers()
    setStage('idle')
    setRunning(false)
  }

  return (
    <section id="mpesa" className="py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-12 text-center">
          <Badge
            variant="outline"
            className="mb-3 border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
          >
            <Zap className="mr-1.5 h-3 w-3" /> Live Simulation
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Watch M-Pesa payments flow in
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            Parents pay via Paybill 522522. SkulHub reconciles the payment and clears the
            invoice balance automatically — no data entry needed.
          </p>
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-2">
          {/* Left: invoice + control */}
          <GlowCard className="rounded-2xl border border-emerald-500/15 bg-card/60 p-6 backdrop-blur-md md:p-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <Receipt className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Invoice #INV-2025-0418</p>
                  <p className="text-[11px] text-muted-foreground">Term 2 fees · Amani Wanjiru</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'border',
                  stage === 'success'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
                )}
              >
                {stage === 'success' ? 'PAID' : 'PENDING'}
              </Badge>
            </div>

            <div className="space-y-2 rounded-xl border border-emerald-500/10 bg-background/50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tuition</span>
                <span className="font-medium">KES 4,500</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Boarding</span>
                <span className="font-medium">KES 500</span>
              </div>
              <div className="my-2 border-t border-dashed border-emerald-500/20" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Balance Due</span>
                <motion.span
                  key={stage}
                  initial={{ scale: 0.9, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={cn(
                    'text-2xl font-bold',
                    stage === 'success' ? 'text-emerald-600' : 'text-foreground',
                  )}
                >
                  KES {stage === 'success' ? '0' : '5,000'}
                </motion.span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button
                size="lg"
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
                onClick={simulate}
                disabled={running}
              >
                {running ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…
                  </>
                ) : (
                  <>
                    <Smartphone className="mr-2 h-4 w-4" /> Simulate Payment
                  </>
                )}
              </Button>
              {stage === 'success' && (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={reset}
                >
                  Reset Demo
                </Button>
              )}
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Demo only — no real money moves. In production, parents dial the actual Paybill.
            </p>
          </GlowCard>

          {/* Right: phone mockup */}
          <div className="flex justify-center">
            <PhoneMockup stage={stage} />
          </div>
        </div>
      </div>
    </section>
  )
}

function PhoneMockup({ stage }: { stage: MpesaStage }) {
  const reduce = useReducedMotion()
  return (
    <div className="relative h-[460px] w-[230px]">
      {/* Phone frame */}
      <div className="absolute inset-0 rounded-[2.5rem] border-[6px] border-slate-800 bg-slate-900 shadow-2xl dark:border-slate-700">
        {/* Notch */}
        <div className="absolute left-1/2 top-2 h-4 w-20 -translate-x-1/2 rounded-full bg-slate-800 dark:bg-slate-700" />
        {/* Screen */}
        <div className="absolute inset-0 overflow-hidden rounded-[2rem] bg-gradient-to-b from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-slate-800">
          {/* Status bar */}
          <div className="flex items-center justify-between px-4 pb-1 pt-6 text-[9px] font-medium text-slate-500 dark:text-slate-400">
            <span>9:42</span>
            <span>SkulHub Pay</span>
            <span>●●●</span>
          </div>

          {/* Stage content */}
          <div className="flex h-full flex-col items-center justify-center px-4 pb-16">
            <AnimatePresence mode="wait">
              {stage === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600">
                    <CreditCard className="h-7 w-7" />
                  </div>
                  <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                    Awaiting payment
                  </p>
                  <p className="mt-1 text-[9px] text-slate-500 dark:text-slate-400">
                    Tap “Simulate Payment” on the invoice
                  </p>
                </motion.div>
              )}

              {stage === 'stk' && (
                <motion.div
                  key="stk"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="w-full rounded-xl border border-emerald-500/30 bg-white/90 p-3 shadow-lg dark:bg-slate-800/90"
                >
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-600 text-[8px] font-bold text-white">
                      MP
                    </div>
                    <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400">
                      M-Pesa
                    </span>
                    <span className="ml-auto text-[8px] text-slate-400">now</span>
                  </div>
                  <p className="text-[10px] font-medium text-slate-700 dark:text-slate-200">
                    SkulHub
                  </p>
                  <p className="mt-1 text-[9px] text-slate-600 dark:text-slate-300">
                    Confirm payment of KES 5,000 to SkulHub. Enter M-Pesa PIN.
                  </p>
                  <motion.div
                    className="mt-2 h-1 w-full overflow-hidden rounded-full bg-emerald-500/20"
                    animate={reduce ? {} : { opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    <motion.div
                      className="h-full bg-emerald-600"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.4, ease: 'easeInOut' }}
                    />
                  </motion.div>
                </motion.div>
              )}

              {stage === 'processing' && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center text-center"
                >
                  <Loader2 className="mb-3 h-12 w-12 animate-spin text-emerald-600" />
                  <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                    Processing payment…
                  </p>
                  <p className="mt-1 text-[9px] text-slate-500 dark:text-slate-400">
                    Safaricom is confirming the transaction
                  </p>
                </motion.div>
              )}

              {stage === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                    className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg"
                  >
                    <CheckCircle2 className="h-9 w-9" />
                  </motion.div>
                  <p className="text-[12px] font-bold text-emerald-700 dark:text-emerald-400">
                    Payment Confirmed
                  </p>
                  <p className="mt-1 text-[10px] font-medium text-slate-700 dark:text-slate-200">
                    KES 5,000 paid
                  </p>
                  <div className="mt-3 w-full rounded-lg border border-emerald-500/30 bg-emerald-50/80 p-2 dark:bg-emerald-950/40">
                    <p className="flex items-center justify-center gap-1 text-[9px] font-medium text-emerald-700 dark:text-emerald-400">
                      <Check className="h-3 w-3" /> Invoice balance: KES 0
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stats Counter Band — 4 numbers count up on scroll
// ---------------------------------------------------------------------------

function StatsBand() {
  const stats = [
    { target: 33, suffix: '+', label: 'Modules', icon: Package },
    { target: 30, suffix: '', label: 'Day Free Trial', icon: Clock },
    { target: 100, suffix: '%', label: 'CBE Aligned', icon: BookOpen },
    { target: 0, prefix: 'KES ', suffix: '', label: 'Setup Fee', icon: Sparkles },
  ]
  return (
    <section className="border-y border-emerald-500/15 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 py-12 text-white">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="flex flex-col items-center text-center">
                <Icon className="mb-2 h-6 w-6 text-white/80" />
                <p className="text-3xl font-bold md:text-4xl">
                  <CountUp target={s.target} prefix={s.prefix} suffix={s.suffix} />
                </p>
                <p className="mt-1 text-xs font-medium text-white/80 md:text-sm">{s.label}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Testimonials — 3 Kenyan principals with 5-star amber ratings
// ---------------------------------------------------------------------------

function Testimonials() {
  return (
    <section id="testimonials" className="py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-12 text-center">
          <Badge
            variant="outline"
            className="mb-3 border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
          >
            <Star className="mr-1.5 h-3 w-3 fill-amber-500 text-amber-500" /> Trusted by Kenyan Schools
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            What school leaders say
          </h2>
          <p className="mt-2 text-muted-foreground">
            From Nairobi to Mombasa to Kisumu — schools run smoother on SkulHub
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid gap-6 md:grid-cols-3"
        >
          {TESTIMONIALS.map((t) => (
            <motion.div key={t.school} variants={fadeUpItem}>
              <GlowCard className="h-full rounded-2xl border border-emerald-500/15 bg-card/60 p-6 backdrop-blur-md">
                <CardContent className="p-0">
                  <Quote className="mb-3 h-7 w-7 text-emerald-500/40" />
                  <div className="mb-3 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={`star-${i}`}
                        className="h-4 w-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">
                    “{t.quote}”
                  </p>
                  <div className="mt-5 flex items-center gap-3 border-t border-emerald-500/10 pt-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.role}</p>
                      <p className="text-xs text-muted-foreground">{t.school}</p>
                    </div>
                  </div>
                </CardContent>
              </GlowCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Smart Report Comments Demo — typewriter, falls back to template
// ---------------------------------------------------------------------------

function fallbackComment(name: string, grade: string) {
  const safe = name.trim() || 'the learner'
  return `${safe} has shown commendable progress in ${grade}. The learner demonstrates strong analytical skills and active participation in class discussions. Consistent effort in assignments and a positive attitude toward collaborative tasks are notable. With continued dedication, ${safe} is well-positioned to excel in the Competency-Based Education (CBE) assessments. Encouraging further reading and independent research will deepen understanding across all learning areas.`
}

function AiDemo() {
  const [studentName, setStudentName] = useState('Amani Wanjiru')
  const [grade, setGrade] = useState('Grade 6')
  const [loading, setLoading] = useState(false)
  const [comment, setComment] = useState('')
  const [hasResult, setHasResult] = useState(false)

  const generate = async () => {
    if (!studentName.trim()) {
      toast.error('Enter a student name first')
      return
    }
    setLoading(true)
    setHasResult(false)
    setComment('')
    try {
      const res = await fetch('/api/ai/landing-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentName: studentName.trim(), grade }),
      })
      const data = (await res.json().catch(() => ({}))) as { comment?: string }
      const text = (data && data.comment) || fallbackComment(studentName, grade)
      setComment(text)
      setHasResult(true)
    } catch {
      setComment(fallbackComment(studentName, grade))
      setHasResult(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="ai-demo" className="border-t bg-muted/30 py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-12 text-center">
          <Badge
            variant="outline"
            className="mb-3 border-teal-300 bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400"
          >
            <Sparkles className="mr-1.5 h-3 w-3" /> Smart Report Comments
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Draft report comments in seconds
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            Enter a student name and grade — SkulHub composes a CBE-aligned narrative comment
            you can review, edit, and drop straight into a report card.
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          <GlowCard className="rounded-2xl border border-emerald-500/15 bg-card/60 p-6 backdrop-blur-md md:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ai-student" className="text-xs font-medium">
                  Student name
                </Label>
                <Input
                  id="ai-student"
                  placeholder="e.g. Amani Wanjiru"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-grade" className="text-xs font-medium">
                  Grade / Form
                </Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger id="ai-grade" className="w-full">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
                      'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
                      'Form 1', 'Form 2', 'Form 3', 'Form 4',
                    ].map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              className="mt-5 w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
              onClick={generate}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Composing…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" /> Generate Comment
                </>
              )}
            </Button>

            {/* Output */}
            <div className="mt-6 rounded-xl border border-emerald-500/15 bg-background/60 p-5 min-h-[140px]">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  Composing a personalised comment…
                </div>
              ) : hasResult ? (
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" /> Draft comment
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      Review & edit before publishing
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">
                    <Typewriter key={comment} text={comment} speed={18} />
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Your generated comment will appear here with a typewriter effect. Try it now →
                </p>
              )}
            </div>
          </GlowCard>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// FAQ — 10 expandable questions with ChevronDown rotation
// ---------------------------------------------------------------------------

function FaqSection() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" className="py-20">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <div className="mb-12 text-center">
          <Badge
            variant="outline"
            className="mb-3 border-cyan-300 bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400"
          >
            FAQ
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-2 text-muted-foreground">
            Everything you need to know before starting your free trial
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i
            return (
              <div
                key={f.q}
                className={cn(
                  'overflow-hidden rounded-xl border bg-card/40 backdrop-blur-md transition-colors',
                  isOpen
                    ? 'border-emerald-400/50 bg-emerald-50/30 dark:bg-emerald-950/10'
                    : 'border-emerald-500/10 hover:border-emerald-400/40',
                )}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-semibold md:text-base">{f.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                      isOpen ? 'bg-emerald-600 text-white' : 'bg-emerald-500/10 text-emerald-600',
                    )}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">
                        {f.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground">Still have questions?</p>
          <a
            href="#contact"
            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:underline"
          >
            Talk to our team <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

function PricingSection({ onCta }: { onCta: () => void }) {
  return (
    <section id="pricing" className="border-t bg-muted/30 py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-12 text-center">
          <Badge
            variant="outline"
            className="mb-3 border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
          >
            Simple Pricing
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-2 text-muted-foreground">
            Choose the plan that fits your school. No hidden fees.
          </p>
        </div>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid gap-6 md:grid-cols-3"
        >
          {PLANS.map((p) => (
            <motion.div key={p.name} variants={fadeUpItem}>
              <GlowCard
                className={cn(
                  'h-full rounded-2xl border bg-card/60 backdrop-blur-md',
                  p.popular
                    ? 'border-2 border-emerald-400 shadow-xl'
                    : 'border-emerald-500/15',
                )}
              >
                <CardContent className="p-6">
                  {p.popular && (
                    <Badge className="mb-2 bg-emerald-600 text-white">Most Popular</Badge>
                  )}
                  <h3 className="text-xl font-bold">{p.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-sm text-muted-foreground">KES</span>
                    <span className="text-4xl font-bold">{p.price}</span>
                    <span className="text-sm text-muted-foreground">{p.period}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{p.students}</p>
                  <ul className="mt-4 space-y-2">
                    {p.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={cn(
                      'mt-6 w-full',
                      p.popular && 'bg-emerald-600 text-white hover:bg-emerald-700',
                    )}
                    variant={p.popular ? 'default' : 'outline'}
                    onClick={onCta}
                  >
                    Start Free Trial
                  </Button>
                </CardContent>
              </GlowCard>
            </motion.div>
          ))}
        </motion.div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          All prices in KES · VAT inclusive · Cancel anytime · 30-day money-back guarantee
        </p>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Demo Video Section (preserves original behaviour)
// ---------------------------------------------------------------------------

function DemoVideoSection({ onPlay }: { onPlay: () => void }) {
  return (
    <section id="demo" className="py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-12 text-center">
          <Badge
            variant="outline"
            className="mb-3 border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
          >
            <Play className="mr-1.5 h-3 w-3" /> Watch Demo
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            See SkulHub in action
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            A 2-minute walkthrough of the dashboard, student management, finance, and parent portal
          </p>
        </div>
        <div className="relative mx-auto max-w-4xl">
          <button
            onClick={onPlay}
            className="group relative block w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-emerald-500/20"
          >
            <img
              src="/images/demo-poster.png"
              alt="SkulHub demo video — product walkthrough of dashboard, students, finance and parent portal"
              className="aspect-video w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600/90 shadow-2xl ring-4 ring-white/30 backdrop-blur transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:ring-white/50">
                <Play className="ml-1 h-9 w-9 fill-white text-white" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-left">
              <p className="text-xs font-medium text-emerald-300">PRODUCT TOUR · 2 MIN</p>
              <h3 className="mt-1 text-xl font-bold text-white">
                Complete School Management Walkthrough
              </h3>
              <p className="mt-1 text-sm text-white/70">
                From admissions to report cards — see how SkulHub handles it all
              </p>
            </div>
          </button>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { icon: TrendingUp, title: 'Live Dashboard', desc: 'Real-time stats & charts' },
              { icon: Users2, title: 'Student Records', desc: 'Admissions, grades, health' },
              { icon: DollarSign, title: 'Fee Management', desc: 'Invoices & M-Pesa payments' },
            ].map((h) => {
              const Icon = h.icon
              return (
                <div key={h.title} className="flex items-center gap-3 rounded-xl border border-emerald-500/10 bg-card/60 p-4 backdrop-blur-md">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{h.title}</p>
                    <p className="text-xs text-muted-foreground">{h.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Final CTA
// ---------------------------------------------------------------------------

function FinalCta({ onCta, onSignIn }: { onCta: () => void; onSignIn: () => void }) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-8 text-center text-white shadow-2xl md:p-12">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Ready to transform your school?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            Join the growing community of Kenyan schools using SkulHub. Start your free 30-day
            trial today — no credit card required.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              variant="secondary"
              className="w-full bg-white text-emerald-700 hover:bg-white/90 sm:w-auto"
              onClick={onCta}
            >
              Register Your School <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full border-white/30 text-white hover:bg-white/10 sm:w-auto"
              onClick={onSignIn}
            >
              View Demo
            </Button>
          </div>
        </Card>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Footer (with contact form + brand + links)
// ---------------------------------------------------------------------------

function Footer({
  onRegister,
  onLogin,
  onStaffSignup,
  onParent,
}: {
  onRegister: () => void
  onLogin: () => void
  onStaffSignup: () => void
  onParent: () => void
}) {
  return (
    <footer
      id="contact"
      className="mt-auto border-t border-emerald-500/10 bg-gradient-to-br from-slate-50 to-emerald-50/30 py-16 dark:from-slate-950 dark:to-emerald-950/20"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <School className="h-4 w-4" />
              </div>
              <span className="font-bold">SkulHub</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              The complete school management system for Kenyan schools and institutions worldwide.
            </p>
            <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              <p className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-emerald-600" /> 0742 340 924
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-3 w-3 text-emerald-600" /> info@skulhub.co.ke
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-emerald-600" /> Nairobi, Kenya
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Lock className="h-3 w-3 text-emerald-600" /> Data encrypted & isolated per school
            </div>
          </div>

          {/* Product links */}
          <div>
            <p className="mb-3 text-sm font-semibold">Product</p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><a href="#features" className="hover:text-emerald-600 hover:underline">Features</a></li>
              <li><a href="#demo" className="hover:text-emerald-600 hover:underline">Watch Demo</a></li>
              <li><a href="#modules" className="hover:text-emerald-600 hover:underline">Modules</a></li>
              <li><a href="#mpesa" className="hover:text-emerald-600 hover:underline">M-Pesa Demo</a></li>
              <li><a href="#ai-demo" className="hover:text-emerald-600 hover:underline">Smart Reports</a></li>
              <li><a href="#pricing" className="hover:text-emerald-600 hover:underline">Pricing</a></li>
              <li>
                <button onClick={onRegister} className="hover:text-emerald-600 hover:underline">
                  Start Free Trial
                </button>
              </li>
            </ul>
          </div>

          {/* Quick access */}
          <div>
            <p className="mb-3 text-sm font-semibold">Quick Access</p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <button onClick={onLogin} className="hover:text-emerald-600 hover:underline">
                  Staff Login
                </button>
              </li>
              <li>
                <button onClick={onRegister} className="hover:text-emerald-600 hover:underline">
                  Register Your School
                </button>
              </li>
              <li>
                <button onClick={onStaffSignup} className="hover:text-emerald-600 hover:underline">
                  Staff Sign Up
                </button>
              </li>
              <li>
                <button onClick={onParent} className="hover:text-emerald-600 hover:underline">
                  Parent Portal
                </button>
              </li>
              <li><a href="#faq" className="hover:text-emerald-600 hover:underline">FAQ</a></li>
              <li><a href="#testimonials" className="hover:text-emerald-600 hover:underline">Testimonials</a></li>
            </ul>
          </div>

          {/* Contact form */}
          <ContactForm />
        </div>
        <div className="mt-8 border-t border-emerald-500/10 pt-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} SkulHub. All rights reserved. Built with ❤️ in Kenya.
        </div>
      </div>
    </footer>
  )
}

function ContactForm() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !phone.trim() || !message.trim()) {
      toast.error('Please fill in your name, phone number, and message')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, message }),
      })
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string }
      if (res.ok && data.success) {
        toast.success('Message sent!', {
          description: 'Our team will reach out to you within 24 hours.',
        })
        setName('')
        setPhone('')
        setEmail('')
        setMessage('')
      } else {
        toast.error('Could not send message', { description: data?.error || 'Please try again' })
      }
    } catch {
      toast.error('Network error', {
        description: 'Please check your connection and try again',
      })
    }
    setSubmitting(false)
  }

  return (
    <div>
      <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
        <MessageSquare className="h-4 w-4 text-emerald-600" /> Reach Out to Us
      </p>
      <p className="mb-3 text-xs text-muted-foreground">
        Have a question? Want a demo? Leave your details and we&apos;ll call you back.
      </p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <Input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 text-xs"
        />
        <Input
          placeholder="Phone number (e.g. 0742 340 924)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="h-8 text-xs"
        />
        <Input
          type="email"
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-8 text-xs"
        />
        <Textarea
          placeholder="Your message or question..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[60px] text-xs"
        />
        <Button
          type="submit"
          size="sm"
          disabled={submitting}
          className="w-full bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
        >
          {submitting ? 'Sending...' : (
            <>
              <Send className="mr-1.5 h-3.5 w-3.5" /> Send Message
            </>
          )}
        </Button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Demo Video Modal — auto-playing animated product tour with controls
// ---------------------------------------------------------------------------

function DemoVideoModal({ onClose }: { onClose: () => void }) {
  const [scene, setScene] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [progress, setProgress] = useState(0) // 0-100 within current scene
  const scenes = [
    {
      title: 'Dashboard Overview',
      desc: 'Real-time stats: student counts, fee collection, attendance trends',
      icon: BarChart3,
      color: 'from-emerald-600 to-teal-700',
    },
    {
      title: 'Student Management',
      desc: 'Admissions, profiles, guardians, enrollment history',
      icon: Users,
      color: 'from-cyan-600 to-emerald-700',
    },
    {
      title: 'Finance & Fees',
      desc: 'Invoices, M-Pesa payments, receipts, outstanding balances',
      icon: Wallet,
      color: 'from-amber-600 to-emerald-700',
    },
    {
      title: 'Academics & Exams',
      desc: 'CBE (Grade 1-12) + 8-4-4 subjects, CATs, report cards, grade analytics',
      icon: ClipboardCheck,
      color: 'from-teal-600 to-cyan-700',
    },
    {
      title: 'Parent Portal',
      desc: 'Parents check fees, grades, attendance from their phone',
      icon: Smartphone,
      color: 'from-emerald-600 to-cyan-700',
    },
  ]
  const SCENE_DURATION = 3500 // ms per scene

  // Auto-advance scenes + progress bar (simulates video playback)
  useEffect(() => {
    if (!playing) return
    const startTime = Date.now()
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startTime
      const pct = Math.min(100, (elapsed / SCENE_DURATION) * 100)
      setProgress(pct)
      if (pct >= 100) {
        setScene((s) => (s + 1) % scenes.length)
      }
    }, 50)
    return () => window.clearInterval(timer)
  }, [playing, scene, scenes.length])

  // Keyboard shortcuts: Space=play/pause, ←/→=scenes, Esc=close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        setPlaying((p) => !p)
      } else if (e.code === 'ArrowRight') {
        setScene((s) => (s + 1) % scenes.length)
        setProgress(0)
      } else if (e.code === 'ArrowLeft') {
        setScene((s) => (s - 1 + scenes.length) % scenes.length)
        setProgress(0)
      } else if (e.code === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, scenes.length])

  const current = scenes[scene]
  const Icon = current.icon
  const totalProgress = ((scene + progress / 100) / scenes.length) * 100

  const goToScene = (i: number) => {
    setScene(i)
    setProgress(0)
    setPlaying(true)
  }

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    const targetScene = Math.min(scenes.length - 1, Math.floor(pct * scenes.length))
    goToScene(targetScene)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-11 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          aria-label="Close video"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="overflow-hidden rounded-2xl bg-slate-900 shadow-2xl ring-1 ring-white/10">
          {/* Video header bar */}
          <div className="flex items-center justify-between border-b border-white/10 bg-slate-800/80 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <School className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-medium text-white">SkulHub Product Tour</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  playing ? 'animate-pulse bg-rose-500' : 'bg-white/40',
                )}
              />
              <span className="text-[10px] font-medium text-white/60">
                {playing ? 'PLAYING' : 'PAUSED'} · {Math.round(totalProgress)}%
              </span>
            </div>
          </div>

          {/* "Video" stage */}
          <div className={cn('relative aspect-video overflow-hidden bg-gradient-to-br', current.color)}>
            {/* Animated background orbs */}
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

            {/* Scene content with slide transition */}
            <motion.div
              key={scene}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 text-white shadow-2xl backdrop-blur-md">
                <Icon className="h-10 w-10" />
              </div>
              <h3 className="text-3xl font-bold tracking-tight text-white drop-shadow md:text-4xl">
                {current.title}
              </h3>
              <p className="mt-3 max-w-lg text-base text-white/90 drop-shadow md:text-lg">
                {current.desc}
              </p>
              <div className="mt-5 rounded-full bg-white/10 px-3 py-1 backdrop-blur">
                <span className="text-xs font-medium text-white/80">
                  Scene {scene + 1} of {scenes.length}
                </span>
              </div>
            </motion.div>

            {/* Play/pause overlay button */}
            <button
              onClick={() => setPlaying((p) => !p)}
              className="group absolute inset-0 flex items-center justify-center"
              aria-label={playing ? 'Pause' : 'Play'}
            >
              <div
                className={cn(
                  'flex h-16 w-16 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/30 backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:bg-white/30',
                  playing && 'opacity-0 group-hover:opacity-100',
                )}
              >
                {playing ? (
                  <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                  </svg>
                ) : (
                  <svg className="ml-1 h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </div>
            </button>
          </div>

          {/* Video controls bar */}
          <div className="bg-slate-800/95 px-4 py-3">
            {/* Timeline scrubber */}
            <div
              className="group/timeline relative mb-2 h-1.5 cursor-pointer rounded-full bg-white/20"
              onClick={handleScrub}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                style={{ width: `${totalProgress}%` }}
              />
              <div
                className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 shadow group-hover/timeline:opacity-100"
                style={{ left: `calc(${totalProgress}% - 6px)` }}
              />
            </div>
            {/* Controls row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPlaying((p) => !p)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                  aria-label={playing ? 'Pause' : 'Play'}
                >
                  {playing ? (
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                    </svg>
                  ) : (
                    <svg className="ml-0.5 h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
                <span className="text-[11px] font-medium text-white/70">
                  {String(scene + 1).padStart(2, '0')}:
                  {String(Math.floor(progress / 1.666)).padStart(2, '0')} / 00:18
                </span>
              </div>
              {/* Scene dots */}
              <div className="flex items-center gap-1.5">
                {scenes.map((s, i) => (
                  <button
                    key={s.title}
                    onClick={() => goToScene(i)}
                    className={cn(
                      'h-2 rounded-full transition-all',
                      i === scene ? 'w-8 bg-emerald-400' : 'w-2 bg-white/30 hover:bg-white/50',
                    )}
                    aria-label={`Go to scene ${i + 1}: ${s.title}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="flex items-center justify-between border-t border-white/10 bg-slate-800/80 px-4 py-3">
            <p className="text-xs text-white/60">Want to explore the real thing? Start your free trial</p>
            <Button
              size="sm"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => {
                onClose()
                useAuthStore.getState().setAuthView('register')
              }}
            >
              Start Free Trial <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <p className="mt-3 text-center text-[10px] text-white/40">
          Press <kbd className="rounded bg-white/10 px-1 py-0.5">Space</kbd> to play/pause ·{' '}
          <kbd className="rounded bg-white/10 px-1 py-0.5">←</kbd>{' '}
          <kbd className="rounded bg-white/10 px-1 py-0.5">→</kbd> to navigate ·{' '}
          <kbd className="rounded bg-white/10 px-1 py-0.5">Esc</kbd> to close
        </p>
      </div>
    </div>
  )
}
