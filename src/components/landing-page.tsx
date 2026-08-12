'use client'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  School, Users, GraduationCap, BookOpen, Wallet, CalendarCheck,
  Library, Bus, HeartPulse, Megaphone, Scale, Home, Package,
  UtensilsCrossed, ClipboardCheck, FileText, BarChart3, Settings,
  ArrowRight, Check, Smartphone, Shield, Zap, Clock, Star,
  ChevronRight, Building2, Phone, Mail, MapPin, TrendingUp,
  Database, Lock, Globe, Award, Target, Coffee,
} from 'lucide-react'

const MODULES = [
  { name: 'Dashboard', icon: BarChart3, color: 'from-emerald-400 to-teal-500' },
  { name: 'Students', icon: Users, color: 'from-teal-400 to-cyan-500' },
  { name: 'Staff', icon: GraduationCap, color: 'from-cyan-400 to-blue-500' },
  { name: 'Academics', icon: BookOpen, color: 'from-violet-400 to-purple-500' },
  { name: 'Attendance', icon: CalendarCheck, color: 'from-amber-400 to-orange-500' },
  { name: 'Finance', icon: Wallet, color: 'from-green-400 to-emerald-500' },
  { name: 'Report Cards', icon: FileText, color: 'from-rose-400 to-pink-500' },
  { name: 'Health', icon: HeartPulse, color: 'from-pink-400 to-rose-500' },
  { name: 'Discipline', icon: Scale, color: 'from-orange-400 to-red-500' },
  { name: 'Hostel', icon: Home, color: 'from-indigo-400 to-violet-500' },
  { name: 'Communications', icon: Megaphone, color: 'from-yellow-400 to-amber-500' },
  { name: 'Library', icon: Library, color: 'from-lime-400 to-green-500' },
  { name: 'Transport', icon: Bus, color: 'from-sky-400 to-blue-500' },
  { name: 'Cafeteria', icon: UtensilsCrossed, color: 'from-red-400 to-rose-500' },
  { name: 'Payroll', icon: Wallet, color: 'from-emerald-400 to-green-500' },
  { name: 'Procurement', icon: Package, color: 'from-amber-400 to-yellow-500' },
  { name: 'Examinations', icon: ClipboardCheck, color: 'from-purple-400 to-violet-500' },
  { name: 'Inventory', icon: Package, color: 'from-teal-400 to-emerald-500' },
  { name: 'Events', icon: CalendarCheck, color: 'from-pink-400 to-fuchsia-500' },
  { name: 'Alumni', icon: Users, color: 'from-cyan-400 to-teal-500' },
  { name: 'Parent Portal', icon: Smartphone, color: 'from-blue-400 to-indigo-500' },
  { name: 'Staff Room Board', icon: Building2, color: 'from-slate-400 to-gray-500' },
  { name: 'ID Cards', icon: FileText, color: 'from-orange-400 to-amber-500' },
  { name: 'Feedback', icon: Star, color: 'from-yellow-400 to-orange-500' },
  { name: 'Visitors & Gate', icon: Shield, color: 'from-gray-400 to-slate-500' },
  { name: 'Facility Booking', icon: Building2, color: 'from-violet-400 to-indigo-500' },
  { name: 'Lesson Plans', icon: BookOpen, color: 'from-green-400 to-lime-500' },
  { name: 'Homework', icon: FileText, color: 'from-rose-400 to-red-500' },
  { name: 'Appraisals', icon: Award, color: 'from-amber-400 to-orange-500' },
  { name: 'Data Import', icon: Database, color: 'from-teal-400 to-cyan-500' },
  { name: 'Inventory Requests', icon: Package, color: 'from-indigo-400 to-blue-500' },
  { name: 'Settings', icon: Settings, color: 'from-slate-400 to-gray-500' },
]

const FEATURES = [
  { icon: Shield, title: 'Secure & Role-Based', desc: '13 staff roles with granular permissions. Teachers never see financial data. Every action is audit-logged.', color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
  { icon: Smartphone, title: 'Parent Portal', desc: 'Parents check fees, grades, and attendance from their phone — using school code + admission number.', color: 'from-blue-500 to-cyan-600', bg: 'bg-blue-50 dark:bg-blue-950/20' },
  { icon: Zap, title: 'M-Pesa Ready', desc: 'Record payments via M-Pesa Paybill 522522. Invoices auto-update. Parents get instant confirmation.', color: 'from-green-500 to-emerald-600', bg: 'bg-green-50 dark:bg-green-950/20' },
  { icon: Clock, title: 'Live Dashboard', desc: 'Real-time clock, attendance trends, fee collection rates, and announcements — all on one screen.', color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50 dark:bg-amber-950/20' },
  { icon: Building2, title: 'Multi-School Platform', desc: 'Each school gets isolated data. Register unlimited schools. Super admin manages everything from one panel.', color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50 dark:bg-violet-950/20' },
  { icon: BookOpen, title: 'CBC & 8-4-4 Support', desc: "Supports Kenya's Competency-Based Curriculum (Grade 1-8) and 8-4-4 (Form 1-4) with KCSE grading.", color: 'from-rose-500 to-pink-600', bg: 'bg-rose-50 dark:bg-rose-950/20' },
]

const STATS = [
  { label: 'Modules', value: '33+', icon: Package, color: 'text-emerald-600' },
  { label: 'Staff Roles', value: '13', icon: Shield, color: 'text-teal-600' },
  { label: 'Demo Students', value: '426', icon: Users, color: 'text-cyan-600' },
  { label: 'Free Trial', value: '30 days', icon: Clock, color: 'text-amber-600' },
]

const PLANS = [
  { name: 'Starter', price: '2,500', period: '/month', students: 'Up to 200 students', features: ['All 33+ modules', '5 user accounts', 'Parent portal', 'Email support'], popular: false, color: 'from-slate-500 to-gray-600' },
  { name: 'Standard', price: '5,000', period: '/month', students: 'Up to 1,000 students', features: ['Everything in Starter', '20 user accounts', 'SMS notifications', 'Priority support', 'Data migration included'], popular: true, color: 'from-emerald-500 to-teal-600' },
  { name: 'Premium', price: '10,000', period: '/month', students: 'Unlimited students', features: ['Everything in Standard', 'Unlimited users', 'M-Pesa integration', 'Dedicated support', 'Custom branding', 'API access'], popular: false, color: 'from-violet-500 to-purple-600' },
]

const TESTIMONIALS = [
  { name: 'Principal, Nairobi Academy', text: 'SkulHub replaced 5 different systems we were using. Now everything is in one place — fees, attendance, exams, parent communication.', rating: 5, initial: 'P', color: 'from-emerald-500 to-teal-600' },
  { name: 'Bursar, Kiambu High School', text: 'M-Pesa payments auto-update invoices. No more manual receipt books. Parents love the portal — they check fees from their phone.', rating: 5, initial: 'B', color: 'from-amber-500 to-orange-600' },
  { name: 'Teacher, Mombasa Primary', text: 'Marking attendance takes 30 seconds. Report cards are generated automatically with KCSE grading. Game changer.', rating: 5, initial: 'T', color: 'from-violet-500 to-purple-600' },
]

export function LandingPage() {
  const { setAuthView } = useAuthStore()

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-white to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-emerald-100/50 bg-white/70 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
              <School className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">SkulHub</span>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-emerald-600 transition-colors">Features</a>
            <a href="#modules" className="text-sm font-medium text-muted-foreground hover:text-emerald-600 transition-colors">Modules</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-emerald-600 transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-emerald-600 transition-colors">Reviews</a>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAuthView('login')}>Sign In</Button>
            <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/20" onClick={() => setAuthView('register')}>Start Free Trial</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section — Gradient background */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 via-teal-500/5 to-cyan-500/10" />
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -right-20 top-40 h-96 w-96 rounded-full bg-teal-400/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-4 border-emerald-300 bg-emerald-50/80 text-emerald-700 backdrop-blur dark:bg-emerald-950/40 dark:text-emerald-400">
              <Zap className="mr-1.5 h-3 w-3" /> 33+ Modules · CBC & 8-4-4 · M-Pesa Ready · Parent Portal
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              The complete school management system for{' '}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">Kenyan schools</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Students, academics, finance, health, transport, payroll, and more — all in one platform.
              Built for Kenya. Scalable worldwide. Start your 30-day free trial today.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 w-full shadow-lg shadow-emerald-500/30 sm:w-auto" onClick={() => setAuthView('register')}>
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="w-full border-emerald-200 hover:bg-emerald-50 sm:w-auto" onClick={() => setAuthView('login')}>
                View Live Demo
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">No credit card required · Setup in 2 minutes · Cancel anytime</p>
          </div>

          {/* Stats — Gradient cards */}
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
            {STATS.map(s => {
              const Icon = s.icon
              return (
                <div key={s.label} className="rounded-2xl border border-emerald-100/50 bg-white/60 p-5 text-center shadow-sm backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/60">
                  <Icon className={`mx-auto mb-2 h-6 w-6 ${s.color}`} />
                  <p className="text-3xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features — Colored gradient cards */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3 border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">Why SkulHub</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Everything your school needs, in one place</h2>
            <p className="mt-2 text-muted-foreground">Powerful features designed specifically for Kenyan schools</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <div key={f.title} className={`group relative overflow-hidden rounded-2xl border p-6 transition-all hover:shadow-xl ${f.bg}`}>
                  <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${f.color} text-white shadow-lg`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                  <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${f.color} opacity-5 transition-opacity group-hover:opacity-10`} />
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Modules Grid — Colorful gradient icons */}
      <section id="modules" className="bg-gradient-to-b from-emerald-50/40 to-white py-20 dark:from-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3 border-teal-200 bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400">All-in-One Platform</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">33+ Modules. One Platform.</h2>
            <p className="mt-2 text-muted-foreground">From admissions to alumni — every aspect of school management covered</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {MODULES.map((m, i) => {
              const Icon = m.icon
              return (
                <div key={m.name} className="group flex items-center gap-3 rounded-xl border border-emerald-100/50 bg-white/60 p-3 transition-all hover:shadow-md hover:border-emerald-300 dark:border-slate-700/50 dark:bg-slate-900/60">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${m.color} text-white shadow-sm transition-transform group-hover:scale-110`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="truncate text-sm font-semibold">{m.name}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3 border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400">Testimonials</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Schools love SkulHub</h2>
            <p className="mt-2 text-muted-foreground">See what principals, bursars, and teachers say about us</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map(t => (
              <Card key={t.name} className="stat-card">
                <CardContent className="p-6">
                  <div className="mb-3 flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-sm text-muted-foreground italic">"{t.text}"</p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${t.color} text-sm font-bold text-white`}>
                      {t.initial}
                    </div>
                    <p className="text-xs font-medium">{t.name}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing — Gradient highlighted popular plan */}
      <section id="pricing" className="bg-gradient-to-b from-white to-emerald-50/30 py-20 dark:from-slate-950 dark:to-emerald-950/10">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3 border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">Pricing</Badge>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Simple, transparent pricing</h2>
            <p className="mt-2 text-muted-foreground">Choose the plan that fits your school. No hidden fees.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {PLANS.map(p => (
              <div key={p.name} className={`relative overflow-hidden rounded-2xl border p-6 transition-all hover:shadow-xl ${p.popular ? 'border-2 border-emerald-400 shadow-lg' : 'border-border'}`}>
                {p.popular && (
                  <div className="absolute right-0 top-0 rounded-bl-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}
                <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${p.color} text-white shadow-md`}>
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">{p.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-sm text-muted-foreground">KES</span>
                  <span className="text-4xl font-bold">{p.price}</span>
                  <span className="text-sm text-muted-foreground">{p.period}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{p.students}</p>
                <ul className="mt-4 space-y-2">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                        <Check className="h-3 w-3" />
                      </div>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`mt-6 w-full ${p.popular ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md' : ''}`}
                  variant={p.popular ? 'default' : 'outline'}
                  onClick={() => setAuthView('register')}
                >
                  Start Free Trial
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — Full gradient */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-8 text-center text-white shadow-2xl md:p-16">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-amber-300/10 blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Ready to transform your school?</h2>
              <p className="mx-auto mt-3 max-w-xl text-white/80">
                Join the growing community of Kenyan schools using SkulHub. Start your free 30-day trial today — no credit card required.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="lg" variant="secondary" className="bg-white text-emerald-700 hover:bg-white/90 w-full shadow-lg sm:w-auto" onClick={() => setAuthView('register')}>
                  Register Your School <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto" onClick={() => setAuthView('login')}>
                  View Live Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-emerald-100/50 bg-gradient-to-b from-white to-emerald-50/20 py-12 dark:from-slate-950 dark:to-slate-900">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                  <School className="h-4 w-4" />
                </div>
                <span className="font-bold">SkulHub</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">The complete school management system for Kenyan schools and institutions worldwide.</p>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Product</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li><a href="#features" className="hover:text-emerald-600">Features</a></li>
                <li><a href="#modules" className="hover:text-emerald-600">Modules</a></li>
                <li><a href="#pricing" className="hover:text-emerald-600">Pricing</a></li>
                <li><button onClick={() => setAuthView('register')} className="hover:text-emerald-600">Free Trial</button></li>
              </ul>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Contact</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> +254 700 000 000</li>
                <li className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> info@skulhub.co.ke</li>
                <li className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Nairobi, Kenya</li>
              </ul>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Get Started</p>
              <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700" onClick={() => setAuthView('register')}>
                Start Free Trial <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-8 border-t border-emerald-100/50 pt-4 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} SkulHub. All rights reserved. Built with ❤️ in Kenya.
          </div>
        </div>
      </footer>
    </div>
  )
}
