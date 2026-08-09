'use client'
import { useState } from 'react'
import { useFetch, apiPost } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/format'
import { toast } from 'sonner'
import {
  Upload, FileSpreadsheet, Users, GraduationCap, BookOpen, BookMarked,
  Truck, Building2, UsersRound, DoorOpen, CheckCircle2, AlertCircle,
  Loader2, Copy, ClipboardPaste, Info,
} from 'lucide-react'

interface ImportType {
  type: string
  label: string
  fields: string[]
}

const TYPE_ICONS: Record<string, any> = {
  students: Users,
  staff: GraduationCap,
  books: BookOpen,
  subjects: BookMarked,
  suppliers: Truck,
  facilities: Building2,
  alumni: UsersRound,
  visitors: DoorOpen,
}

export function DataImportModule() {
  const { user } = useAuthStore()
  const { data: schema, loading } = useFetch<{ types: ImportType[] }>('/api/import')
  const [activeType, setActiveType] = useState('students')
  const [csvText, setCsvText] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ created: number; total: number; errors: string[]; errorCount: number } | null>(null)

  const types = schema?.types || []
  const currentType = types.find(t => t.type === activeType)

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split('\n').filter(l => l.trim())
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.trim())
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim())
      const obj: any = {}
      headers.forEach((h, i) => { obj[h] = values[i] || '' })
      return obj
    })
  }

  const handleImport = async () => {
    const parsed = parseCSV(csvText)
    if (parsed.length === 0) { toast.error('No data to import. Paste CSV with header row and at least one data row.'); return }
    setImporting(true)
    setResult(null)
    try {
      const res = await apiPost<{ success: boolean; created: number; total: number; errors: string[]; errorCount: number }>('/api/import', { type: activeType, data: parsed })
      setResult(res)
      if (res.created > 0) {
        toast.success(`Imported ${res.created} ${activeType} records successfully!`)
        setCsvText('')
      }
      if (res.errorCount > 0) {
        toast.warning(`${res.errorCount} rows had errors`)
      }
    } catch (e: any) {
      toast.error('Import failed', { description: e?.message })
    } finally {
      setImporting(false)
    }
  }

  const loadSample = () => {
    if (!currentType) return
    const samples: Record<string, string> = {
      students: 'firstName,lastName,gender,email,phone,dateOfBirth,bloodGroup,county,boarding,admissionNo,guardianName,guardianPhone\nJohn,Mwangi,Male,john@gmail.com,+254712345678,2008-05-15,O+,Nairobi,true,ADM/9001,Peter Mwangi,+254722345678\nJane,Wanjiru,Female,jane@gmail.com,+254713456789,2009-03-22,A+,Kiambu,false,ADM/9002,Mary Wanjiru,+254733456789',
      staff: 'firstName,lastName,role,gender,email,phone,qualification,specialization,employmentType,salary\nDennis,Kiprop,Teacher,Male,dennis@gmail.com,+254714567890,B.Ed,Mathematics,Permanent,95000\nSarah,Chebet,Teacher,Female,sarah@gmail.com,+254715678901,M.Ed,English,Contract,85000',
      books: 'title,author,isbn,category,publisher,yearPublished,copiesTotal,shelfLocation\nKiswahili Sanifu,Ochieng D.,9789966311234,Languages,KLB,2023,15,A-3\nPhysics Today,Kiprop S.,9789966531234,Science,Moran,2022,10,B-5',
      subjects: 'name,code,category\nGeography,GEO,Optional\nBusiness Studies,BST,Optional',
      suppliers: 'name,category,contact,phone,email,address\nNairobi Books Ltd,Stationery,John Manager,+254720123456,info@nairobibooks.co.ke,Ngara, Nairobi\nLab Equip KE,Equipment,Jane Sales,+254721234567,sales@labequip.co.ke,Industrial Area',
      facilities: 'name,type,capacity,location\nAssembly Hall,Hall,500,Block A\nFootball Field,Field,200,Sports Complex\nComputer Lab 2,Lab,40,Block C',
      alumni: 'firstName,lastName,gender,email,phone,graduationYear,career,employer,industry,location\nBrian,Omondi,Male,brian@gmail.com,+254712345678,2020,Software Engineer,Safaricom,Technology,Nairobi\nEsther,Njeri,Female,esther@gmail.com,+254722345678,2019,Doctor,KNH,Healthcare,Nairobi',
      visitors: 'visitorName,idNumber,phone,purpose,personToSee,vehicleReg,status,checkInTime\nJames Kamau,12345678,+254712345678,Parent Visit,Grace (Form 2),KDA 123A,Checked Out,2025-01-15T10:00:00\nMary Achieng,87654321,+254722345678,Delivery,Stores,KDB 456B,Checked Out,2025-01-16T14:00:00',
    }
    setCsvText(samples[activeType] || '')
    toast.info('Sample data loaded — click Import to add these records')
  }

  if (loading && !schema) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Upload className="h-3 w-3" /> Bulk import existing school data
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Data Import & Migration</h2>
          <p className="mt-1 max-w-2xl text-sm text-white/80">
            Transfer existing school records into the system. Paste CSV data for students, staff, books,
            subjects, suppliers, facilities, alumni, or visitor history. Imported data becomes available
            across all modules and users.
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div className="text-sm">
          <p className="font-medium text-emerald-800 dark:text-emerald-400">How it works</p>
          <ol className="mt-1 list-inside list-decimal space-y-0.5 text-xs text-muted-foreground">
            <li>Select a data type below</li>
            <li>Paste your CSV data (first row = column headers, subsequent rows = data)</li>
            <li>Click "Import Data" — the system parses and creates records automatically</li>
            <li>Imported data is instantly available in the relevant module for all users</li>
          </ol>
        </div>
      </div>

      {/* Type selector cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {types.map(t => {
          const Icon = TYPE_ICONS[t.type] || FileSpreadsheet
          const active = activeType === t.type
          return (
            <button
              key={t.type}
              onClick={() => { setActiveType(t.type); setResult(null); setCsvText('') }}
              className={cn(
                'flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all',
                active ? 'border-2 border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-border hover:bg-muted/40'
              )}
            >
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', active ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted text-muted-foreground')}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{t.label}</p>
                <p className="text-[10px] text-muted-foreground">{t.fields.length} fields</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Import area */}
      {currentType && (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Left: CSV input */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {(() => { const Icon = TYPE_ICONS[currentType.type] || FileSpreadsheet; return <Icon className="h-4 w-4 text-emerald-600" /> })()}
                    Import {currentType.label}
                  </CardTitle>
                  <CardDescription className="text-xs">Paste CSV data below — first row must be column headers</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={loadSample}>
                    <Copy className="mr-1.5 h-3.5 w-3.5" /> Sample
                  </Button>
                  <Button size="sm" onClick={handleImport} disabled={importing || !csvText.trim()} className="bg-emerald-600 hover:bg-emerald-700">
                    {importing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
                    {importing ? 'Importing...' : 'Import Data'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                placeholder={`firstName,lastName,gender,email,phone\nJohn,Mwangi,Male,john@gmail.com,+254712345678\nJane,Wanjiru,Female,jane@gmail.com,+254713456789`}
                className="min-h-[300px] font-mono text-xs"
              />
              <p className="mt-2 text-[10px] text-muted-foreground">
                {csvText.trim() ? `${parseCSV(csvText).length} rows detected` : 'Paste your CSV data here. Use commas to separate fields.'}
              </p>
            </CardContent>
          </Card>

          {/* Right: Field guide + result */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Required Fields
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {currentType.fields.map(f => {
                    const required = f.includes('*')
                    return (
                      <div key={f} className="flex items-center gap-2 text-xs">
                        <span className={cn('h-1.5 w-1.5 rounded-full', required ? 'bg-rose-500' : 'bg-muted-foreground/30')} />
                        <span className="font-mono">{f}</span>
                        {required && <Badge variant="outline" className="text-[9px] text-rose-600">required</Badge>}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {result && (
              <Card className={cn('border-2', result.created > 0 ? 'border-emerald-300' : 'border-rose-300')}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {result.created > 0 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
                    Import Result
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="text-[10px] uppercase text-muted-foreground">Total</p>
                      <p className="text-lg font-bold">{result.total}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950/20">
                      <p className="text-[10px] uppercase text-emerald-600">Created</p>
                      <p className="text-lg font-bold text-emerald-600">{result.created}</p>
                    </div>
                    <div className="rounded-lg bg-rose-50 p-2 dark:bg-rose-950/20">
                      <p className="text-[10px] uppercase text-rose-600">Errors</p>
                      <p className="text-lg font-bold text-rose-600">{result.errorCount}</p>
                    </div>
                  </div>
                  {result.errors.length > 0 && (
                    <div className="max-h-32 overflow-y-auto scrollbar-thin space-y-1 rounded-lg border p-2">
                      {result.errors.map((e, i) => (
                        <p key={i} className="text-[10px] text-rose-600">{e}</p>
                      ))}
                    </div>
                  )}
                  {result.created > 0 && (
                    <p className="text-xs text-emerald-600 font-medium">
                      ✓ {result.created} {currentType.label} records are now available in the {currentType.label} module for all users.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Summary of what's available across the system */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardPaste className="h-4 w-4 text-emerald-600" /> Current System Data
          </CardTitle>
          <CardDescription className="text-xs">Data available across all modules and users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {[
              { label: 'Students', value: 252, icon: Users },
              { label: 'Staff', value: 58, icon: GraduationCap },
              { label: 'Books', value: 15, icon: BookOpen },
              { label: 'Subjects', value: 13, icon: BookMarked },
              { label: 'Suppliers', value: 10, icon: Truck },
              { label: 'Facilities', value: 14, icon: Building2 },
              { label: 'Alumni', value: 135, icon: UsersRound },
              { label: 'Visitors', value: 10, icon: DoorOpen },
            ].map(s => {
              const Icon = s.icon
              return (
                <div key={s.label} className="rounded-lg border p-3 text-center">
                  <Icon className="mx-auto h-4 w-4 text-muted-foreground" />
                  <p className="mt-1 text-lg font-bold">{formatNumber(s.value)}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
