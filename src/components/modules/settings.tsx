'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { SectionHeader } from '@/components/shared'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Settings as SettingsIcon,
  Building2,
  GraduationCap,
  Bell,
  ShieldCheck,
  Save,
  Plus,
  School,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Globe,
  Coins,
  Clock,
  Smartphone,
  CreditCard,
  CheckCircle2,
  UserCog,
  Trash2,
  Hash,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// KCSE 12-point grading scale
// ---------------------------------------------------------------------------
const KCSE_GRADES = [
  { grade: 'A',  points: 12, min: 80, max: 100 },
  { grade: 'A-', points: 11, min: 75, max: 79 },
  { grade: 'B+', points: 10, min: 70, max: 74 },
  { grade: 'B',  points: 9,  min: 65, max: 69 },
  { grade: 'B-', points: 8,  min: 60, max: 64 },
  { grade: 'C+', points: 7,  min: 55, max: 59 },
  { grade: 'C',  points: 6,  min: 50, max: 54 },
  { grade: 'C-', points: 5,  min: 45, max: 49 },
  { grade: 'D+', points: 4,  min: 40, max: 44 },
  { grade: 'D',  points: 3,  min: 35, max: 39 },
  { grade: 'D-', points: 2,  min: 30, max: 34 },
  { grade: 'E',  points: 1,  min: 0,  max: 29 },
]

const EXAM_TYPES = [
  'Opener',
  'Continuous Assessment',
  'Mid-Term',
  'End Term',
  'Mock',
  'National (KCSE)',
  'National (KCPE)',
]

interface MockUser {
  id: string
  name: string
  email: string
  role: string
  status: 'Active' | 'Suspended' | 'Invited'
  lastLogin: string
}
const INITIAL_USERS: MockUser[] = [
  { id: 'u1', name: 'James Mwangi', email: 'principal@skulhub.ac.ke', role: 'Principal', status: 'Active', lastLogin: '2 hours ago' },
  { id: 'u2', name: 'Mary Atieno', email: 'bursar@skulhub.ac.ke', role: 'Bursar', status: 'Active', lastLogin: '5 hours ago' },
  { id: 'u3', name: 'Peter Kamau', email: 'teacher.peter@skulhub.ac.ke', role: 'Teacher', status: 'Active', lastLogin: '1 day ago' },
  { id: 'u4', name: 'Grace Wanjiru', email: 'librarian@skulhub.ac.ke', role: 'Librarian', status: 'Active', lastLogin: '3 days ago' },
  { id: 'u5', name: 'Samuel Kiprop', email: 'teacher.samuel@skulhub.ac.ke', role: 'Teacher', status: 'Invited', lastLogin: 'Never' },
]

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------
export function SettingsModule() {
  const [tab, setTab] = useState('general')

  // General state
  const [schoolName, setSchoolName] = useState('SkulHub Academy')
  const [motto, setMotto] = useState('Elimu Nguvu · Knowledge is Power')
  const [address, setAddress] = useState('P.O. Box 12345-00100, Nairobi, Kenya')
  const [phone, setPhone] = useState('+254 700 000 000')
  const [email, setEmail] = useState('info@skulhub.ac.ke')
  const [academicYear, setAcademicYear] = useState('2025')
  const [currentTerm, setCurrentTerm] = useState('Term 1')
  const [termStart, setTermStart] = useState('2025-01-06')
  const [termEnd, setTermEnd] = useState('2025-04-04')
  const [currency, setCurrency] = useState('KES')
  const [timezone, setTimezone] = useState('Africa/Nairobi')
  const [language, setLanguage] = useState<'English' | 'Swahili'>('English')

  // Academic state
  const [passMark, setPassMark] = useState('50')
  const [promotionCriteria, setPromotionCriteria] = useState('Average ≥ 50% and attendance ≥ 80%')

  // Notifications state
  const [smsGateway, setSmsGateway] = useState('Safaricom')
  const [smsApiKey, setSmsApiKey] = useState('')
  const [smsSenderId, setSmsSenderId] = useState('EDUMG')
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com')
  const [smtpPort, setSmtpPort] = useState('587')
  const [smtpUser, setSmtpUser] = useState('notifications@skulhub.ac.ke')
  const [smtpPassword, setSmtpPassword] = useState('')
  const [mpesaPaybill, setMpesaPaybill] = useState('522522')
  const [mpesaAccount, setMpesaAccount] = useState('Admission No.')
  const [mpesaCallback, setMpesaCallback] = useState('https://skulhub.ac.ke/api/mpesa/callback')
  const [notifPrefs, setNotifPrefs] = useState({
    feeReminders: true,
    attendanceAlerts: true,
    examResults: true,
    eventReminders: false,
    transportUpdates: true,
    libraryOverdue: true,
  })
  const [smsEnabled, setSmsEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [mpesaEnabled, setMpesaEnabled] = useState(true)

  // Users state
  const [users, setUsers] = useState<MockUser[]>(INITIAL_USERS)
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Teacher' })

  function handleSave(section: string) {
    toast.success(`${section} settings saved`, {
      description: 'Changes have been applied to your local configuration.',
    })
  }

  function handleAddUser(e: React.FormEvent) {
    e.preventDefault()
    if (!newUser.name.trim() || !newUser.email.trim()) {
      toast.error('Name and email are required')
      return
    }
    const id = `u${users.length + 1}-${Date.now()}`
    setUsers([
      ...users,
      {
        id,
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        role: newUser.role,
        status: 'Invited',
        lastLogin: 'Never',
      },
    ])
    toast.success('User invited', { description: `${newUser.name} added as ${newUser.role}` })
    setNewUser({ name: '', email: '', role: 'Teacher' })
    setAddUserOpen(false)
  }

  function handleDeleteUser(id: string) {
    const u = users.find((x) => x.id === id)
    setUsers(users.filter((x) => x.id !== id))
    toast.success('User removed', { description: u ? `${u.name} has been removed` : '' })
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="System Settings"
        description="Manage your school profile, academic configuration, notifications and system users"
        icon={SettingsIcon}
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:flex sm:w-auto">
          <TabsTrigger value="general" className="gap-1.5"><Building2 className="h-4 w-4" /> General</TabsTrigger>
          <TabsTrigger value="academic" className="gap-1.5"><GraduationCap className="h-4 w-4" /> Academic</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5"><Bell className="h-4 w-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5"><ShieldCheck className="h-4 w-4" /> Users & Roles</TabsTrigger>
        </TabsList>

        {/* ----------------------------------------------------------------- */}
        {/* General */}
        {/* ----------------------------------------------------------------- */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <School className="h-4.5 w-4.5 text-emerald-600" /> School Profile
              </CardTitle>
              <CardDescription>Basic information about your institution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row">
                {/* Logo */}
                <div className="flex flex-col items-center gap-2 sm:w-32">
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 text-white shadow-lg">
                    <div className="text-center">
                      <GraduationCap className="mx-auto h-8 w-8" />
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide">SkulHub</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => toast.info('Logo upload — coming soon')}>
                    Upload Logo
                  </Button>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="school-name">School Name</Label>
                    <Input id="school-name" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="motto">Motto</Label>
                    <Input id="motto" value={motto} onChange={(e) => setMotto(e.target.value)} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="address" className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Address</Label>
                      <Textarea id="address" rows={2} value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</Label>
                        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4.5 w-4.5 text-teal-600" /> Academic Calendar
                </CardTitle>
                <CardDescription>Current academic year and term settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="year">Academic Year</Label>
                    <Input id="year" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="term">Current Term</Label>
                    <Select value={currentTerm} onValueChange={setCurrentTerm}>
                      <SelectTrigger id="term"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Term 1">Term 1</SelectItem>
                        <SelectItem value="Term 2">Term 2</SelectItem>
                        <SelectItem value="Term 3">Term 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="t-start">Term Start</Label>
                    <Input id="t-start" type="date" value={termStart} onChange={(e) => setTermStart(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="t-end">Term End</Label>
                    <Input id="t-end" type="date" value={termEnd} onChange={(e) => setTermEnd(e.target.value)} />
                  </div>
                </div>
                <div className="rounded-md bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <p className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Active term
                  </p>
                  <p className="mt-0.5">
                    {currentTerm}, {academicYear} · {termStart} → {termEnd}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="h-4.5 w-4.5 text-cyan-600" /> Localization
                </CardTitle>
                <CardDescription>Regional and language preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="currency" className="flex items-center gap-1"><Coins className="h-3 w-3" /> Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KES">KES — Kenyan Shilling</SelectItem>
                      <SelectItem value="USD">USD — US Dollar</SelectItem>
                      <SelectItem value="TSH">TSH — Tanzanian Shilling</SelectItem>
                      <SelectItem value="UGX">UGX — Ugandan Shilling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tz" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger id="tz"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Nairobi">Africa/Nairobi (GMT+3)</SelectItem>
                      <SelectItem value="Africa/Dar_es_Salaam">Africa/Dar es Salaam (GMT+3)</SelectItem>
                      <SelectItem value="Africa/Kampala">Africa/Kampala (GMT+3)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Default Language</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['English', 'Swahili'] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setLanguage(lang)}
                        className={cn(
                          'flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors',
                          language === lang
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'border-border hover:bg-muted',
                        )}
                      >
                        <span className="font-medium">{lang}</span>
                        {language === lang && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleSave('General')}>
              <Save className="mr-1.5 h-4 w-4" /> Save Changes
            </Button>
          </div>
        </TabsContent>

        {/* ----------------------------------------------------------------- */}
        {/* Academic */}
        {/* ----------------------------------------------------------------- */}
        <TabsContent value="academic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Hash className="h-4.5 w-4.5 text-emerald-600" /> KCSE Grading System (12-Point Scale)
              </CardTitle>
              <CardDescription>
                Kenya National Examinations Council grade-to-points conversion used for report cards and transcripts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grade</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Min %</TableHead>
                      <TableHead>Max %</TableHead>
                      <TableHead>Interpretation</TableHead>
                      <TableHead className="text-right">Color</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {KCSE_GRADES.map((g) => {
                      const interp =
                        g.points >= 10 ? 'Distinction' :
                        g.points >= 7 ? 'Credit' :
                        g.points >= 4 ? 'Pass' : 'Fail'
                      const color =
                        g.grade.startsWith('A') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                        g.grade.startsWith('B') ? 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400' :
                        g.grade.startsWith('C') ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                        g.grade.startsWith('D') ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400' :
                        'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                      return (
                        <TableRow key={g.grade}>
                          <TableCell><Badge variant="outline" className={cn('font-mono font-bold', color)}>{g.grade}</Badge></TableCell>
                          <TableCell className="font-mono font-semibold">{g.points}</TableCell>
                          <TableCell>{g.min}</TableCell>
                          <TableCell>{g.max}</TableCell>
                          <TableCell className="text-sm">{interp}</TableCell>
                          <TableCell className="text-right">
                            <span className={cn('inline-block h-3 w-8 rounded-full', color.split(' ')[0])} />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Examination Types</CardTitle>
                <CardDescription>Configured exam categories for grading & reporting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {EXAM_TYPES.map((t) => (
                    <Badge key={t} variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                      {t}
                    </Badge>
                  ))}
                </div>
                <Separator className="my-3" />
                <div className="space-y-1.5">
                  <Label htmlFor="passmark">Pass Mark Threshold (%)</Label>
                  <Input id="passmark" type="number" min={0} max={100} value={passMark} onChange={(e) => setPassMark(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Students scoring below this mark are flagged as needing support.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Promotion Criteria</CardTitle>
                <CardDescription>Rules for advancing students to the next class level</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="promo">Promotion Rule</Label>
                  <Textarea id="promo" rows={3} value={promotionCriteria} onChange={(e) => setPromotionCriteria(e.target.value)} />
                </div>
                <div className="rounded-md border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Active rules:</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4">
                    <li>Minimum mean grade of C- (5 points) for upper classes</li>
                    <li>Attendance ≥ 80% required</li>
                    <li>No outstanding fee balance above KES 5,000</li>
                    <li>Disciplinary record reviewed by class teacher</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleSave('Academic')}>
              <Save className="mr-1.5 h-4 w-4" /> Save Changes
            </Button>
          </div>
        </TabsContent>

        {/* ----------------------------------------------------------------- */}
        {/* Notifications */}
        {/* ----------------------------------------------------------------- */}
        <TabsContent value="notifications" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Smartphone className="h-4.5 w-4.5 text-emerald-600" /> SMS Gateway
                    </CardTitle>
                    <CardDescription>Send fee reminders & alerts via SMS</CardDescription>
                  </div>
                  <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sms-gw">Gateway Provider</Label>
                  <Select value={smsGateway} onValueChange={setSmsGateway} disabled={!smsEnabled}>
                    <SelectTrigger id="sms-gw"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Safaricom">Safaricom</SelectItem>
                      <SelectItem value="Airtel">Airtel</SelectItem>
                      <SelectItem value="Africa's Talking">Africa's Talking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sms-key">API Key</Label>
                  <Input id="sms-key" type="password" placeholder="••••••••••••••••" value={smsApiKey} onChange={(e) => setSmsApiKey(e.target.value)} disabled={!smsEnabled} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sms-sender">Sender ID</Label>
                  <Input id="sms-sender" maxLength={11} value={smsSenderId} onChange={(e) => setSmsSenderId(e.target.value)} disabled={!smsEnabled} />
                </div>
                <div className="rounded-md bg-muted/30 p-2 text-xs text-muted-foreground">
                  Rate: <span className="font-semibold text-foreground">KES 0.80</span> per SMS · Test balance: <span className="font-semibold text-emerald-600">KES 4,200</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Mail className="h-4.5 w-4.5 text-teal-600" /> Email (SMTP)
                    </CardTitle>
                    <CardDescription>Send reports & newsletters via email</CardDescription>
                  </div>
                  <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="smtp-host">SMTP Host</Label>
                    <Input id="smtp-host" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} disabled={!emailEnabled} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="smtp-port">Port</Label>
                    <Input id="smtp-port" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} disabled={!emailEnabled} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="smtp-user">Username</Label>
                  <Input id="smtp-user" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} disabled={!emailEnabled} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="smtp-pass">Password</Label>
                  <Input id="smtp-pass" type="password" placeholder="••••••••" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} disabled={!emailEnabled} />
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CreditCard className="h-4.5 w-4.5 text-amber-600" /> M-Pesa Integration
                    </CardTitle>
                    <CardDescription>Accept fee payments via Safaricom M-Pesa Paybill</CardDescription>
                  </div>
                  <Switch checked={mpesaEnabled} onCheckedChange={setMpesaEnabled} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="mpesa-pb">Paybill Number</Label>
                    <Input id="mpesa-pb" value={mpesaPaybill} onChange={(e) => setMpesaPaybill(e.target.value)} disabled={!mpesaEnabled} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="mpesa-acct">Account Reference</Label>
                    <Select value={mpesaAccount} onValueChange={setMpesaAccount} disabled={!mpesaEnabled}>
                      <SelectTrigger id="mpesa-acct"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admission No.">Admission No.</SelectItem>
                        <SelectItem value="Student Name">Student Name</SelectItem>
                        <SelectItem value="Invoice No.">Invoice No.</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="mpesa-cb">Callback URL</Label>
                    <Input id="mpesa-cb" value={mpesaCallback} onChange={(e) => setMpesaCallback(e.target.value)} disabled={!mpesaEnabled} />
                  </div>
                </div>
                <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                  <p className="font-medium">Payment Instructions for Parents</p>
                  <p className="mt-1">Go to M-Pesa → Lipa na M-Pesa → Paybill → Enter <span className="font-mono font-bold">{mpesaPaybill}</span> → Account: <span className="font-mono font-bold">{mpesaAccount}</span></p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notification Preferences</CardTitle>
              <CardDescription>Choose which events trigger automated notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  { key: 'feeReminders', label: 'Fee Payment Reminders', desc: 'Alert parents 7 days before invoice due date' },
                  { key: 'attendanceAlerts', label: 'Attendance Alerts', desc: 'Notify parents when student is marked absent' },
                  { key: 'examResults', label: 'Exam Results Release', desc: 'Send results to parents after grading is finalised' },
                  { key: 'eventReminders', label: 'School Event Reminders', desc: 'SMS reminders for meetings, sports, holidays' },
                  { key: 'transportUpdates', label: 'Transport Updates', desc: 'Notify parents of route delays or changes' },
                  { key: 'libraryOverdue', label: 'Library Overdue Notices', desc: 'Email students with overdue book loans' },
                ] as const).map((p) => (
                  <div key={p.key} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.desc}</p>
                    </div>
                    <Switch
                      checked={notifPrefs[p.key]}
                      onCheckedChange={(v) => setNotifPrefs((s) => ({ ...s, [p.key]: v }))}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleSave('Notifications')}>
              <Save className="mr-1.5 h-4 w-4" /> Save Changes
            </Button>
          </div>
        </TabsContent>

        {/* ----------------------------------------------------------------- */}
        {/* Users & Roles */}
        {/* ----------------------------------------------------------------- */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" /> System Users
                  </CardTitle>
                  <CardDescription>Manage who has access to SkulHub and their permissions</CardDescription>
                </div>
                <Button size="sm" onClick={() => setAddUserOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="mr-1.5 h-4 w-4" /> Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={cn('text-xs font-semibold text-white',
                                roleColor(u.role))}>
                                {initialsOf(u.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{u.name}</p>
                              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('text-[10px] font-semibold', roleBadgeColor(u.role))}>
                            <UserCog className="mr-1 h-3 w-3" /> {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('h-5 px-1.5 text-[10px]', statusBadgeColor(u.status))}>
                            {u.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground md:table-cell">{u.lastLogin}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => handleDeleteUser(u.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Role Permissions Matrix</CardTitle>
              <CardDescription>Summary of access rights per role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module</TableHead>
                      <TableHead className="text-center">Principal</TableHead>
                      <TableHead className="text-center">Bursar</TableHead>
                      <TableHead className="text-center">Teacher</TableHead>
                      <TableHead className="text-center">Librarian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { mod: 'Dashboard', p: '✓', b: '✓', t: '✓', l: '✓' },
                      { mod: 'Students', p: '✓', b: '✓', t: 'View', l: 'View' },
                      { mod: 'Staff', p: '✓', b: 'View', t: 'View', l: '—' },
                      { mod: 'Academics', p: '✓', b: '—', t: '✓', l: '—' },
                      { mod: 'Attendance', p: '✓', b: '—', t: '✓', l: '—' },
                      { mod: 'Finance', p: '✓', b: '✓', t: 'View', l: '—' },
                      { mod: 'Communications', p: '✓', b: '✓', t: '✓', l: 'View' },
                      { mod: 'Library', p: '✓', b: '—', t: 'View', l: '✓' },
                      { mod: 'Transport', p: '✓', b: 'View', t: '—', l: '—' },
                      { mod: 'Reports', p: '✓', b: '✓', t: '✓', l: 'Limited' },
                      { mod: 'Settings', p: '✓', b: '—', t: '—', l: '—' },
                    ].map((row) => (
                      <TableRow key={row.mod}>
                        <TableCell className="font-medium">{row.mod}</TableCell>
                        <TableCell className="text-center text-emerald-600">{row.p}</TableCell>
                        <TableCell className="text-center text-emerald-600">{row.b}</TableCell>
                        <TableCell className="text-center text-emerald-600">{row.t}</TableCell>
                        <TableCell className="text-center text-emerald-600">{row.l}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add user dialog */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Add System User</DialogTitle>
            <DialogDescription>
              Invite a new staff member to access SkulHub. They will receive an email invitation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="nu-name">Full Name</Label>
              <Input id="nu-name" value={newUser.name} onChange={(e) => setNewUser((s) => ({ ...s, name: e.target.value }))} placeholder="Jane Doe" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nu-email">Email Address</Label>
              <Input id="nu-email" type="email" value={newUser.email} onChange={(e) => setNewUser((s) => ({ ...s, email: e.target.value }))} placeholder="jane@skulhub.ac.ke" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nu-role">Role</Label>
              <Select value={newUser.role} onValueChange={(v) => setNewUser((s) => ({ ...s, role: v }))}>
                <SelectTrigger id="nu-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Principal', 'Deputy Principal', 'Bursar', 'Teacher', 'Librarian', 'Clerk', 'HOD'].map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddUserOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="mr-1.5 h-4 w-4" /> Send Invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase()
}

function roleColor(role: string): string {
  const r = role.toLowerCase()
  if (r.includes('principal')) return 'bg-emerald-600'
  if (r.includes('bursar')) return 'bg-teal-600'
  if (r.includes('teacher') || r.includes('hod')) return 'bg-cyan-600'
  if (r.includes('librar')) return 'bg-amber-600'
  if (r.includes('clerk')) return 'bg-violet-600'
  return 'bg-slate-500'
}

function roleBadgeColor(role: string): string {
  const r = role.toLowerCase()
  if (r.includes('principal')) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
  if (r.includes('bursar')) return 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400'
  if (r.includes('teacher') || r.includes('hod')) return 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400'
  if (r.includes('librar')) return 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
  if (r.includes('clerk')) return 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400'
  return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
}

function statusBadgeColor(status: string): string {
  const s = status.toLowerCase()
  if (s === 'active') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
  if (s === 'suspended') return 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
  if (s === 'invited') return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
}
