'use client'
import { useState } from 'react'
import { apiPost } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Upload, Users, GraduationCap, BookOpen, BookMarked, Truck, Building2,
  UsersRound, DoorOpen, FileSpreadsheet, Plus, CheckCircle2, AlertCircle,
  Loader2, Copy, FileText, ListPlus, Table, Type,
} from 'lucide-react'

const ENTITY_TYPES = [
  { type: 'students', label: 'Students', icon: Users, color: '#10b981', fields: ['firstName*', 'lastName*', 'gender', 'email', 'phone', 'dateOfBirth', 'bloodGroup', 'county', 'boarding', 'admissionNo', 'guardianName', 'guardianPhone'] },
  { type: 'staff', label: 'Staff', icon: GraduationCap, color: '#06b6d4', fields: ['firstName*', 'lastName*', 'role', 'gender', 'email', 'phone', 'qualification', 'specialization', 'employmentType', 'salary', 'employeeNo'] },
  { type: 'books', label: 'Books', icon: BookOpen, color: '#8b5cf6', fields: ['title*', 'author*', 'isbn', 'category', 'publisher', 'yearPublished', 'copiesTotal', 'shelfLocation'] },
  { type: 'subjects', label: 'Subjects', icon: BookMarked, color: '#f59e0b', fields: ['name*', 'code', 'category'] },
  { type: 'suppliers', label: 'Suppliers', icon: Truck, color: '#ef4444', fields: ['name*', 'category', 'contact', 'phone', 'email', 'address'] },
  { type: 'facilities', label: 'Facilities', icon: Building2, color: '#14b8a6', fields: ['name*', 'type', 'capacity', 'location'] },
  { type: 'alumni', label: 'Alumni', icon: UsersRound, color: '#ec4899', fields: ['firstName*', 'lastName*', 'gender', 'email', 'phone', 'graduationYear', 'career', 'employer', 'location'] },
  { type: 'visitors', label: 'Visitors', icon: DoorOpen, color: '#64748b', fields: ['visitorName*', 'idNumber', 'phone', 'purpose', 'personToSee', 'vehicleReg', 'status'] },
]

// Simple form field configs per type
const FORM_FIELDS: Record<string, { key: string; label: string; required?: boolean; placeholder?: string; type?: string; options?: string[] }[]> = {
  students: [
    { key: 'firstName', label: 'First Name', required: true, placeholder: 'John' },
    { key: 'lastName', label: 'Last Name', required: true, placeholder: 'Mwangi' },
    { key: 'gender', label: 'Gender', options: ['Male', 'Female'] },
    { key: 'email', label: 'Email', placeholder: 'john@gmail.com', type: 'email' },
    { key: 'phone', label: 'Phone', placeholder: '+254712345678' },
    { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
    { key: 'bloodGroup', label: 'Blood Group', options: ['A+', 'B+', 'O+', 'AB+', 'A-', 'O-'] },
    { key: 'county', label: 'County', placeholder: 'Nairobi' },
    { key: 'boarding', label: 'Boarding?', options: ['true', 'false'] },
    { key: 'admissionNo', label: 'Admission No', placeholder: 'ADM/9001 (auto if empty)' },
    { key: 'guardianName', label: 'Guardian Name', placeholder: 'Peter Mwangi' },
    { key: 'guardianPhone', label: 'Guardian Phone', placeholder: '+254722345678' },
  ],
  staff: [
    { key: 'firstName', label: 'First Name', required: true },
    { key: 'lastName', label: 'Last Name', required: true },
    { key: 'role', label: 'Role', options: ['Teacher', 'HOD', 'Bursar', 'Librarian', 'Clerk', 'Driver', 'Security', 'Cleaner'] },
    { key: 'gender', label: 'Gender', options: ['Male', 'Female'] },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Phone' },
    { key: 'qualification', label: 'Qualification', placeholder: 'B.Ed' },
    { key: 'specialization', label: 'Specialization', placeholder: 'Mathematics' },
    { key: 'employmentType', label: 'Employment Type', options: ['Permanent', 'Contract', 'Part-time'] },
    { key: 'salary', label: 'Salary (KES)', placeholder: '95000' },
  ],
  books: [
    { key: 'title', label: 'Title', required: true },
    { key: 'author', label: 'Author', required: true },
    { key: 'isbn', label: 'ISBN' },
    { key: 'category', label: 'Category', options: ['Science', 'Mathematics', 'Languages', 'Humanities', 'Business', 'Technical', 'Literature', 'General'] },
    { key: 'publisher', label: 'Publisher' },
    { key: 'yearPublished', label: 'Year Published', placeholder: '2023' },
    { key: 'copiesTotal', label: 'Copies', placeholder: '1' },
    { key: 'shelfLocation', label: 'Shelf Location', placeholder: 'A-3' },
  ],
  subjects: [
    { key: 'name', label: 'Subject Name', required: true, placeholder: 'Geography' },
    { key: 'code', label: 'Code', placeholder: 'GEO (auto if empty)' },
    { key: 'category', label: 'Category', options: ['Core', 'Optional', 'Co-curricular'] },
  ],
  suppliers: [
    { key: 'name', label: 'Supplier Name', required: true },
    { key: 'category', label: 'Category', options: ['Stationery', 'Food', 'Equipment', 'Services', 'Other'] },
    { key: 'contact', label: 'Contact Person' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'address', label: 'Address' },
  ],
  facilities: [
    { key: 'name', label: 'Facility Name', required: true, placeholder: 'Assembly Hall' },
    { key: 'type', label: 'Type', options: ['Hall', 'Ground', 'Lab', 'Classroom', 'Field'] },
    { key: 'capacity', label: 'Capacity', placeholder: '50' },
    { key: 'location', label: 'Location', placeholder: 'Block A' },
  ],
  alumni: [
    { key: 'firstName', label: 'First Name', required: true },
    { key: 'lastName', label: 'Last Name', required: true },
    { key: 'gender', label: 'Gender', options: ['Male', 'Female'] },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Phone' },
    { key: 'graduationYear', label: 'Graduation Year', placeholder: '2020' },
    { key: 'career', label: 'Career', placeholder: 'Software Engineer' },
    { key: 'employer', label: 'Employer', placeholder: 'Safaricom' },
    { key: 'location', label: 'Location', placeholder: 'Nairobi' },
  ],
  visitors: [
    { key: 'visitorName', label: 'Visitor Name', required: true },
    { key: 'idNumber', label: 'ID Number' },
    { key: 'phone', label: 'Phone' },
    { key: 'purpose', label: 'Purpose', options: ['Parent Visit', 'Meeting', 'Delivery', 'Official', 'Contractor', 'Other'] },
    { key: 'personToSee', label: 'Person to See' },
    { key: 'vehicleReg', label: 'Vehicle Reg', placeholder: 'KDA 123A' },
    { key: 'status', label: 'Status', options: ['Checked In', 'Checked Out'] },
  ],
}

export function DataImportModule() {
  const [activeType, setActiveType] = useState('students')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ created: number; total: number; errors: string[]; errorCount: number } | null>(null)
  const [csvText, setCsvText] = useState('')

  const currentType = ENTITY_TYPES.find(t => t.type === activeType)!

  // --- Form state for single record entry ---
  const [formData, setFormData] = useState<Record<string, string>>({})

  const handleFormChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleFormSubmit = async () => {
    const fields = FORM_FIELDS[activeType] || []
    for (const f of fields) {
      if (f.required && !formData[f.key]) {
        toast.error(`${f.label} is required`)
        return
      }
    }
    setImporting(true)
    setResult(null)
    try {
      const res = await apiPost<{ success: boolean; created: number; errors: string[]; errorCount: number }>('/api/import', { type: activeType, data: [formData] })
      setResult({ ...res, total: 1 })
      if (res.created > 0) {
        toast.success(`${currentType.label} added successfully!`)
        setFormData({})
      }
    } catch (e: any) {
      toast.error('Failed to add record', { description: e?.message })
    } finally {
      setImporting(false)
    }
  }

  // --- CSV import ---
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

  const handleCSVImport = async () => {
    const parsed = parseCSV(csvText)
    if (parsed.length === 0) { toast.error('Paste CSV data with a header row and at least one data row.'); return }
    setImporting(true)
    setResult(null)
    try {
      const res = await apiPost<{ success: boolean; created: number; total: number; errors: string[]; errorCount: number }>('/api/import', { type: activeType, data: parsed })
      setResult(res)
      if (res.created > 0) {
        toast.success(`Imported ${res.created} ${currentType.label} records!`)
        setCsvText('')
      }
    } catch (e: any) {
      toast.error('Import failed', { description: e?.message })
    } finally {
      setImporting(false)
    }
  }

  const loadSample = () => {
    const samples: Record<string, string> = {
      students: 'firstName,lastName,gender,email,phone,dateOfBirth,bloodGroup,county,boarding,admissionNo,guardianName,guardianPhone\nJohn,Mwangi,Male,john@gmail.com,+254712345678,2008-05-15,O+,Nairobi,true,ADM/9001,Peter Mwangi,+254722345678\nJane,Wanjiru,Female,jane@gmail.com,+254713456789,2009-03-22,A+,Kiambu,false,ADM/9002,Mary Wanjiru,+254733456789',
      staff: 'firstName,lastName,role,gender,email,phone,qualification,specialization,employmentType,salary\nDennis,Kiprop,Teacher,Male,dennis@gmail.com,+254714567890,B.Ed,Mathematics,Permanent,95000\nSarah,Chebet,Teacher,Female,sarah@gmail.com,+254715678901,M.Ed,English,Contract,85000',
      books: 'title,author,isbn,category,publisher,yearPublished,copiesTotal,shelfLocation\nKiswahili Sanifu,Ochieng D.,9789966311234,Languages,KLB,2023,15,A-3\nPhysics Today,Kiprop S.,9789966531234,Science,Moran,2022,10,B-5',
      subjects: 'name,code,category\nGeography,GEO,Optional\nBusiness Studies,BST,Optional',
      suppliers: 'name,category,contact,phone,email,address\nNairobi Books Ltd,Stationery,John Manager,+254720123456,info@nairobibooks.co.ke,Ngara Nairobi\nLab Equip KE,Equipment,Jane Sales,+254721234567,sales@labequip.co.ke,Industrial Area',
      facilities: 'name,type,capacity,location\nAssembly Hall,Hall,500,Block A\nFootball Field,Field,200,Sports Complex',
      alumni: 'firstName,lastName,gender,email,phone,graduationYear,career,employer,location\nBrian,Omondi,Male,brian@gmail.com,+254712345678,2020,Software Engineer,Safaricom,Nairobi\nEsther,Njeri,Female,esther@gmail.com,+254722345678,2019,Doctor,KNH,Nairobi',
      visitors: 'visitorName,idNumber,phone,purpose,personToSee,vehicleReg,status\nJames Kamau,12345678,+254712345678,Parent Visit,Grace Form 2,KDA 123A,Checked Out\nMary Achieng,87654321,+254722345678,Delivery,Stores,KDB 456B,Checked Out',
    }
    setCsvText(samples[activeType] || '')
  }

  const fields = FORM_FIELDS[activeType] || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <Upload className="h-3 w-3" /> Add data to the system — multiple methods available
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Add Data</h2>
          <p className="mt-1 max-w-2xl text-sm text-white/80">
            Add students, staff, books, and more to the system. Use the form for single entries,
            paste CSV for bulk import, or add multiple records at once. All data becomes available
            across all modules instantly.
          </p>
        </div>
      </div>

      {/* Entity type selector */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ENTITY_TYPES.map(t => {
          const Icon = t.icon
          const active = activeType === t.type
          return (
            <button
              key={t.type}
              onClick={() => { setActiveType(t.type); setResult(null); setFormData({}); setCsvText('') }}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
                active ? 'border-2 bg-muted/30' : 'border-border hover:bg-muted/20'
              )}
              style={active ? { borderColor: t.color } : {}}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${t.color}15` }}>
                <Icon className="h-5 w-5" style={{ color: t.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{t.label}</p>
                <p className="text-[10px] text-muted-foreground">{t.fields.length} fields</p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Tabs: 3 methods */}
      <Tabs defaultValue="form" className="space-y-4">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="form" className="gap-1.5"><Type className="h-4 w-4" /> Single Form</TabsTrigger>
          <TabsTrigger value="csv" className="gap-1.5"><FileSpreadsheet className="h-4 w-4" /> CSV Paste</TabsTrigger>
          <TabsTrigger value="bulk" className="gap-1.5"><ListPlus className="h-4 w-4" /> Quick Add</TabsTrigger>
        </TabsList>

        {/* Method 1: Single Form Entry */}
        <TabsContent value="form">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {(() => { const Icon = currentType.icon; return <Icon className="h-4 w-4" style={{ color: currentType.color }} /> })()}
                Add Single {currentType.label}
              </CardTitle>
              <CardDescription className="text-xs">Fill in the form below to add one record</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {fields.map(f => (
                  <div key={f.key} className="space-y-1">
                    <Label className="text-xs">
                      {f.label} {f.required && <span className="text-rose-500">*</span>}
                    </Label>
                    {f.options ? (
                      <Select value={formData[f.key] || ''} onValueChange={v => handleFormChange(f.key, v)}>
                        <SelectTrigger className="h-9"><SelectValue placeholder={`Select ${f.label}`} /></SelectTrigger>
                        <SelectContent>
                          {f.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={f.type || 'text'}
                        value={formData[f.key] || ''}
                        onChange={e => handleFormChange(f.key, e.target.value)}
                        placeholder={f.placeholder || f.label}
                        className="h-9"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setFormData({})}>Clear</Button>
                <Button size="sm" onClick={handleFormSubmit} disabled={importing} className="bg-emerald-600 hover:bg-emerald-700">
                  {importing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
                  {importing ? 'Adding...' : `Add ${currentType.label}`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Method 2: CSV Paste */}
        <TabsContent value="csv">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2"><FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Bulk CSV Import</CardTitle>
                  <CardDescription className="text-xs">Paste CSV data — first row = column headers, then data rows</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={loadSample}><Copy className="mr-1.5 h-3.5 w-3.5" /> Sample</Button>
                  <Button size="sm" onClick={handleCSVImport} disabled={importing || !csvText.trim()} className="bg-emerald-600 hover:bg-emerald-700">
                    {importing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
                    {importing ? 'Importing...' : 'Import'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                placeholder={`firstName,lastName,gender\nJohn,Mwangi,Male\nJane,Wanjiru,Female`}
                className="min-h-[250px] font-mono text-xs"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Available fields:</span>
                {currentType.fields.map(f => (
                  <Badge key={f} variant="outline" className={cn('text-[9px]', f.includes('*') && 'border-rose-300 text-rose-600')}>
                    {f}
                  </Badge>
                ))}
              </div>
              {csvText.trim() && (
                <p className="mt-1 text-[10px] text-emerald-600">{parseCSV(csvText).length} data rows detected</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Method 3: Quick Add (multiple rows) */}
        <TabsContent value="bulk">
          <QuickAddTab activeType={activeType} fields={fields} onImport={async (records) => {
            setImporting(true)
            setResult(null)
            try {
              const res = await apiPost<{ success: boolean; created: number; total: number; errors: string[]; errorCount: number }>('/api/import', { type: activeType, data: records })
              setResult(res)
              if (res.created > 0) toast.success(`Added ${res.created} ${currentType.label}!`)
            } catch (e: any) { toast.error('Failed to add records') }
            finally { setImporting(false) }
          }} importing={importing} />
        </TabsContent>
      </Tabs>

      {/* Result panel */}
      {result && (
        <Card className={cn('border-2', result.created > 0 ? 'border-emerald-300' : 'border-rose-300')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {result.created > 0 ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-rose-600" />}
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  {result.created > 0
                    ? `${result.created} ${currentType.label} added successfully!`
                    : 'No records were added'}
                </p>
                {result.errorCount > 0 && (
                  <p className="text-xs text-rose-600">{result.errorCount} errors occurred</p>
                )}
                {result.errors.length > 0 && (
                  <div className="mt-1 max-h-24 overflow-y-auto scrollbar-thin space-y-0.5">
                    {result.errors.slice(0, 10).map((e, i) => (
                      <p key={i} className="text-[10px] text-rose-600">{e}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Quick Add Tab — add multiple records with a simple table interface
// ---------------------------------------------------------------------------
function QuickAddTab({ activeType, fields, onImport, importing }: {
  activeType: string
  fields: { key: string; label: string; required?: boolean; options?: string[] }[]
  onImport: (records: Record<string, string>[]) => void
  importing: boolean
}) {
  const [rows, setRows] = useState<Record<string, string>[]>([{}, {}, {}, {}, {}])

  const updateCell = (rowIdx: number, key: string, value: string) => {
    setRows(prev => prev.map((r, i) => i === rowIdx ? { ...r, [key]: value } : r))
  }

  const addRow = () => setRows(prev => [...prev, {}])
  const removeRow = (idx: number) => setRows(prev => prev.filter((_, i) => i !== idx))

  const handleImport = () => {
    // Filter out empty rows
    const valid = rows.filter(r => Object.values(r).some(v => v && v.trim()))
    if (valid.length === 0) { toast.error('Fill in at least one row'); return }
    onImport(valid)
  }

  const visibleFields = fields.slice(0, 6) // Show max 6 fields per row for readability

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><ListPlus className="h-4 w-4 text-emerald-600" /> Quick Add Multiple Records</CardTitle>
        <CardDescription className="text-xs">Type data directly into the table — add as many rows as you need</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left text-[10px] text-muted-foreground w-8">#</th>
                {visibleFields.map(f => (
                  <th key={f.key} className="p-2 text-left text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                    {f.label}{f.required && <span className="text-rose-500"> *</span>}
                  </th>
                ))}
                <th className="p-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className="border-b border-muted/40 hover:bg-muted/20">
                  <td className="p-2 text-[10px] text-muted-foreground">{idx + 1}</td>
                  {visibleFields.map(f => (
                    <td key={f.key} className="p-1">
                      {f.options ? (
                        <select
                          value={row[f.key] || ''}
                          onChange={e => updateCell(idx, f.key, e.target.value)}
                          className="h-8 w-full rounded border border-input bg-transparent px-2 text-xs"
                        >
                          <option value="">—</option>
                          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={row[f.key] || ''}
                          onChange={e => updateCell(idx, f.key, e.target.value)}
                          placeholder={f.label}
                          className="h-8 w-full rounded border border-input bg-transparent px-2 text-xs"
                        />
                      )}
                    </td>
                  ))}
                  <td className="p-1 text-center">
                    <button onClick={() => removeRow(idx)} className="text-rose-400 hover:text-rose-600 text-xs">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex justify-between">
          <Button variant="outline" size="sm" onClick={addRow}><Plus className="mr-1 h-3.5 w-3.5" /> Add Row</Button>
          <Button size="sm" onClick={handleImport} disabled={importing} className="bg-emerald-600 hover:bg-emerald-700">
            {importing ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
            {importing ? 'Adding...' : `Add All ${rows.filter(r => Object.values(r).some(v => v && v.trim())).length} Records`}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
