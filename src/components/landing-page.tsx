'use client'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  School, Users, GraduationCap, BookOpen, Wallet, CalendarCheck,
  Library, Bus, HeartPulse, Megaphone, Scale, Home, Package,
  UtensilsCrossed, ClipboardCheck, FileText, BarChart3, Settings,
  ArrowRight, Check, Smartphone, Shield, Zap, Clock, Star,
  ChevronRight, Building2, Phone, Mail, MapPin,
  Play, X, Send, MessageSquare, TrendingUp, PieChart, Users2, DollarSign,
} from 'lucide-react'
import { toast } from 'sonner'

const MODULES = [
  { name: 'Dashboard', icon: BarChart3, desc: 'Real-time school overview' },
  { name: 'Students', icon: Users, desc: 'Admissions & profiles' },
  { name: 'Staff', icon: GraduationCap, desc: 'Teachers & support staff' },
  { name: 'Academics', icon: BookOpen, desc: 'Classes, subjects, exams' },
  { name: 'Attendance', icon: CalendarCheck, desc: 'Daily tracking & reports' },
  { name: 'Finance & Fees', icon: Wallet, desc: 'Invoices & M-Pesa payments' },
  { name: 'Report Cards', icon: FileText, desc: 'KCSE-style printable reports' },
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
]

const FEATURES = [
  { icon: Shield, title: 'Secure & Role-Based', desc: '13 staff roles with granular permissions. Teachers never see financial data.' },
  { icon: Smartphone, title: 'Parent Portal', desc: 'Parents check fees, grades, and attendance from their phone — no login needed.' },
  { icon: Zap, title: 'M-Pesa Ready', desc: 'Record payments via M-Pesa Paybill 522522. Invoices auto-update.' },
  { icon: Clock, title: 'Live Dashboard', desc: 'Real-time clock, attendance trends, fee collection rates, and announcements.' },
  { icon: Building2, title: 'Multi-School', desc: 'Each school gets isolated data. Register unlimited schools on one platform.' },
  { icon: FileText, title: 'CBC & 8-4-4', desc: 'Supports Kenya\'s Competency-Based Curriculum (Grade 1-8) and 8-4-4 (Form 1-4).' },
]

const PLANS = [
  { name: 'Starter', price: '2,500', period: '/month', students: 'Up to 200 students', features: ['All 33+ modules', '5 user accounts', 'Parent portal', 'Email support'], popular: false },
  { name: 'Standard', price: '5,000', period: '/month', students: 'Up to 1,000 students', features: ['Everything in Starter', '20 user accounts', 'SMS notifications', 'Priority support', 'Data migration included'], popular: true },
  { name: 'Premium', price: '10,000', period: '/month', students: 'Unlimited students', features: ['Everything in Standard', 'Unlimited users', 'M-Pesa integration', 'Dedicated support', 'Custom branding', 'API access'], popular: false },
]

export function LandingPage() {
  const { setAuthView } = useAuthStore()
  const [showVideo, setShowVideo] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
              <School className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">SkulHub</span>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground">Features</a>
            <a href="#demo" className="text-sm font-medium text-muted-foreground hover:text-foreground">Demo</a>
            <a href="#modules" className="text-sm font-medium text-muted-foreground hover:text-foreground">Modules</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">Pricing</a>
            <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground">Contact</a>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setAuthView('login')}>Sign In</Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setAuthView('register')}>Start Free Trial</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />
        <div className="absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-teal-300/30 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-4 border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <Zap className="mr-1.5 h-3 w-3" /> 33+ Modules · CBC & 8-4-4 · M-Pesa Ready
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              The complete school management system for{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Kenyan schools</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Students, academics, finance, health, transport, payroll, and more — all in one platform.
              Built for Kenya. Scalable worldwide. Start your 30-day free trial today.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto" onClick={() => setAuthView('register')}>
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => setAuthView('login')}>
                View Demo
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">No credit card required · Setup in 2 minutes · Cancel anytime</p>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: 'Modules', value: '33+' },
              { label: 'Staff Roles', value: '13' },
              { label: 'Demo Students', value: '426' },
              { label: 'Free Trial', value: '30 days' },
            ].map(s => (
              <div key={s.label} className="rounded-xl border bg-card/60 p-4 text-center backdrop-blur">
                <p className="text-3xl font-bold text-emerald-600">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Why schools choose SkulHub</h2>
            <p className="mt-2 text-muted-foreground">Everything you need to run your school efficiently</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <Card key={f.title} className="stat-card">
                  <CardContent className="p-6">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold">{f.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section id="modules" className="py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">33+ Modules. One Platform.</h2>
            <p className="mt-2 text-muted-foreground">From admissions to alumni — we've got every aspect of school management covered</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {MODULES.map(m => {
              const Icon = m.icon
              return (
                <div key={m.name} className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:border-emerald-300 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10">
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

      {/* Pricing */}
      <section id="pricing" className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">Simple, transparent pricing</h2>
            <p className="mt-2 text-muted-foreground">Choose the plan that fits your school. No hidden fees.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {PLANS.map(p => (
              <Card key={p.name} className={p.popular ? 'border-2 border-emerald-400 shadow-lg' : ''}>
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
                    {p.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`mt-6 w-full ${p.popular ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                    variant={p.popular ? 'default' : 'outline'}
                    onClick={() => setAuthView('register')}
                  >
                    Start Free Trial
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-8 text-center text-white shadow-2xl md:p-12">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Ready to transform your school?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">
              Join the growing community of Kenyan schools using SkulHub. Start your free 30-day trial today — no credit card required.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" variant="secondary" className="bg-white text-emerald-700 hover:bg-white/90 w-full sm:w-auto" onClick={() => setAuthView('register')}>
                Register Your School <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto" onClick={() => setAuthView('login')}>
                View Demo
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Demo Video Section */}
      <section id="demo" className="py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-12 text-center">
            <Badge variant="outline" className="mb-3 border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <Play className="mr-1.5 h-3 w-3" /> Watch Demo
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight">See SkulHub in Action</h2>
            <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
              A 2-minute walkthrough of the dashboard, student management, finance, and parent portal
            </p>
          </div>
          <div className="relative mx-auto max-w-4xl">
            <button
              onClick={() => setShowVideo(true)}
              className="group relative block w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-emerald-500/20"
            >
              <img
                src="/images/demo-poster.png"
                alt="SkulHub demo video"
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
                <h3 className="mt-1 text-xl font-bold text-white">Complete School Management Walkthrough</h3>
                <p className="mt-1 text-sm text-white/70">From admissions to report cards — see how SkulHub handles it all</p>
              </div>
            </button>
            {/* Feature highlights under video */}
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { icon: TrendingUp, title: 'Live Dashboard', desc: 'Real-time stats & charts' },
                { icon: Users2, title: 'Student Records', desc: 'Admissions, grades, health' },
                { icon: DollarSign, title: 'Fee Management', desc: 'Invoices & M-Pesa payments' },
              ].map(h => {
                const Icon = h.icon
                return (
                  <div key={h.title} className="flex items-center gap-3 rounded-xl border bg-card/60 p-4">
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

      {/* Demo Video Modal */}
      <DemoVideoModal open={showVideo} onClose={() => setShowVideo(false)} />

      {/* Footer with Contact Form */}
      <footer id="contact" className="border-t bg-gradient-to-br from-slate-50 to-emerald-50/30 dark:from-slate-950 dark:to-emerald-950/20 py-16">
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
              <p className="mt-3 text-xs text-muted-foreground">The complete school management system for Kenyan schools and institutions worldwide.</p>
              <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                <p className="flex items-center gap-2"><Phone className="h-3 w-3 text-emerald-600" /> 0742 340 924</p>
                <p className="flex items-center gap-2"><Mail className="h-3 w-3 text-emerald-600" /> info@skulhub.co.ke</p>
                <p className="flex items-center gap-2"><MapPin className="h-3 w-3 text-emerald-600" /> Nairobi, Kenya</p>
              </div>
            </div>
            {/* Product links */}
            <div>
              <p className="mb-3 text-sm font-semibold">Product</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><a href="#features" className="hover:text-emerald-600 hover:underline">Features</a></li>
                <li><a href="#demo" className="hover:text-emerald-600 hover:underline">Watch Demo</a></li>
                <li><a href="#modules" className="hover:text-emerald-600 hover:underline">Modules</a></li>
                <li><a href="#pricing" className="hover:text-emerald-600 hover:underline">Pricing</a></li>
                <li><button onClick={() => setAuthView('register')} className="hover:text-emerald-600 hover:underline">Start Free Trial</button></li>
              </ul>
            </div>
            {/* Quick access */}
            <div>
              <p className="mb-3 text-sm font-semibold">Quick Access</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><button onClick={() => setAuthView('login')} className="hover:text-emerald-600 hover:underline">Staff Login</button></li>
                <li><button onClick={() => setAuthView('register')} className="hover:text-emerald-600 hover:underline">Register Your School</button></li>
                <li><button onClick={() => setAuthView('staff-signup')} className="hover:text-emerald-600 hover:underline">Staff Sign Up</button></li>
                <li><button onClick={() => setAuthView('parent')} className="hover:text-emerald-600 hover:underline">Parent Portal</button></li>
              </ul>
            </div>
            {/* Contact form */}
            <ContactForm />
          </div>
          <div className="mt-8 border-t pt-4 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} SkulHub. All rights reserved. Built with ❤️ in Kenya.
          </div>
        </div>
      </footer>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Contact Form — lets visitors submit their phone + message to reach out
// ---------------------------------------------------------------------------
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
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        toast.success('Message sent!', {
          description: 'Our team will reach out to you within 24 hours.',
        })
        setName(''); setPhone(''); setEmail(''); setMessage('')
      } else {
        toast.error('Could not send message', { description: data?.error || 'Please try again' })
      }
    } catch {
      toast.error('Network error', { description: 'Please check your connection and try again' })
    }
    setSubmitting(false)
  }

  return (
    <div>
      <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
        <MessageSquare className="h-4 w-4 text-emerald-600" /> Reach Out to Us
      </p>
      <p className="mb-3 text-xs text-muted-foreground">
        Have a question? Want a demo? Leave your details and we'll call you back.
      </p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <Input
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="h-8 text-xs"
        />
        <Input
          placeholder="Phone number (e.g. 0742 340 924)"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="h-8 text-xs"
        />
        <Input
          type="email"
          placeholder="Email (optional)"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="h-8 text-xs"
        />
        <Textarea
          placeholder="Your message or question..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="min-h-[60px] text-xs"
        />
        <Button
          type="submit"
          size="sm"
          disabled={submitting}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-xs"
        >
          {submitting ? 'Sending...' : <><Send className="mr-1.5 h-3.5 w-3.5" /> Send Message</>}
        </Button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Demo Video Modal — animated product tour (CSS slideshow simulating a video)
// ---------------------------------------------------------------------------
function DemoVideoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [scene, setScene] = useState(0)
  const scenes = [
    { title: 'Dashboard Overview', desc: 'Real-time stats: student counts, fee collection, attendance trends', icon: BarChart3 },
    { title: 'Student Management', desc: 'Admissions, profiles, guardians, enrollment history', icon: Users },
    { title: 'Finance & Fees', desc: 'Invoices, M-Pesa payments, receipts, outstanding balances', icon: Wallet },
    { title: 'Academics & Exams', desc: 'CBC & 8-4-4 subjects, CATs, report cards, grade analytics', icon: ClipboardCheck },
    { title: 'Parent Portal', desc: 'Parents check fees, grades, attendance from their phone', icon: Smartphone },
  ]

  // Auto-advance scenes every 3.5s. Remounting the modal (via key prop)
  // resets scene to 0 automatically when it opens.
  useEffect(() => {
    if (!open) return
    const timer = setInterval(() => {
      setScene(s => (s + 1) % scenes.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [open])

  if (!open) return null
  const current = scenes[scene]
  const Icon = current.icon

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" onClick={onClose}>
      <div className="relative w-full max-w-4xl" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          aria-label="Close"
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
              <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
              <span className="text-[10px] font-medium text-white/60">LIVE DEMO</span>
            </div>
          </div>
          {/* Video content (animated scene) */}
          <div className="relative aspect-video bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900">
            {/* Animated background orbs */}
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
            {/* Scene content */}
            <div key={scene} className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/30">
                <Icon className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold text-white md:text-3xl">{current.title}</h3>
              <p className="mt-2 max-w-md text-sm text-white/70 md:text-base">{current.desc}</p>
            </div>
            {/* Progress dots */}
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
              {scenes.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === scene ? 'w-8 bg-emerald-400' : 'w-1.5 bg-white/30'
                  }`}
                />
              ))}
            </div>
            {/* Scene counter */}
            <div className="absolute right-4 top-4 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-medium text-white/80">
              {scene + 1} / {scenes.length}
            </div>
          </div>
          {/* Video footer with CTA */}
          <div className="flex items-center justify-between border-t border-white/10 bg-slate-800/80 px-4 py-3">
            <p className="text-xs text-white/60">Want to see more? Start your free trial</p>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                onClose()
                useAuthStore.getState().setAuthView('register')
              }}
            >
              Start Free Trial <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

