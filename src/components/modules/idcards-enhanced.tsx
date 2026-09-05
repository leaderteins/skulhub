'use client'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  IdCard, Upload, Loader2, Search, ExternalLink, Printer, Users, QrCode, Camera,
} from 'lucide-react'

interface Student {
  id: string
  firstName: string
  lastName: string
  admissionNo: string
  gender: string
  status: string
  boarding: boolean
  photoUrl?: string | null
  class_name?: string
  stream_name?: string
}

export function IdCardsModule() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Active')
  const [classFilter, setClassFilter] = useState('all')
  const [classLevels, setClassLevels] = useState<any[]>([])
  const [uploadTarget, setUploadTarget] = useState<Student | null>(null)
  const [uploading, setUploading] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string>('')

  const fetchData = useCallback(async () => {
    try {
      const [stuRes, clsRes] = await Promise.all([
        fetch('/api/students').then(r => r.json()).catch(() => ({ students: [] })),
        fetch('/api/academics').then(r => r.json()).catch(() => ({})),
      ])
      setStudents(stuRes.students || [])
      setClassLevels(clsRes.classLevels || [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = students.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (search && !`${s.firstName} ${s.lastName} ${s.admissionNo}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function openIDCard(studentId: string) {
    window.open(`/api/idcards/generate?studentId=${studentId}`, '_blank')
    toast.success('ID Card opened', { description: 'Click Print to save as PDF' })
  }

  function openBatch() {
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (classFilter !== 'all') params.set('classLevelId', classFilter)
    window.open(`/api/idcards/batch?${params.toString()}`, '_blank')
    toast.success('Batch ID Cards opened', { description: `${filtered.length} cards ready to print` })
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500000) {
      toast.error('Image too large', { description: 'Max 500KB. Please compress or resize.' })
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function handlePhotoUpload() {
    if (!uploadTarget || !photoPreview) return
    setUploading(true)
    try {
      const res = await fetch('/api/upload/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: uploadTarget.id,
          personType: 'student',
          photoData: photoPreview,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Photo uploaded', { description: `${uploadTarget.firstName}'s photo has been updated` })
      // Update local state
      setStudents(prev => prev.map(s => s.id === uploadTarget.id ? { ...s, photoUrl: photoPreview } : s))
      setUploadTarget(null)
      setPhotoPreview('')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <IdCard className="h-6 w-6 text-emerald-600" /> ID Card Management
          </h2>
          <p className="text-sm text-muted-foreground">Generate printable ID cards with QR codes &amp; photos</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={openBatch}>
          <Printer className="mr-1.5 h-4 w-4" /> Print All ({filtered.length})
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30"><Users className="h-5 w-5" /></div>
          <div><p className="text-xs text-muted-foreground">Total Students</p><p className="text-xl font-bold">{students.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950/30"><Camera className="h-5 w-5" /></div>
          <div><p className="text-xs text-muted-foreground">With Photos</p><p className="text-xl font-bold">{students.filter(s => s.photoUrl).length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30"><QrCode className="h-5 w-5" /></div>
          <div><p className="text-xs text-muted-foreground">QR Enabled</p><p className="text-xl font-bold">{filtered.length}</p></div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="all">All Status</SelectItem>
          </SelectContent>
        </Select>
        {classLevels.length > 0 && (
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Classes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classLevels.map((cl: any) => <SelectItem key={cl.id} value={cl.id}>{cl.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Student list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-emerald-600" /> Students ({filtered.length})
          </CardTitle>
          <CardDescription className="text-xs">Click "Generate" to view/print ID card, or "Photo" to upload a photo</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {filtered.slice(0, 100).map(s => (
                <div key={s.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden">
                    {s.photoUrl ? (
                      <img src={s.photoUrl} alt={s.firstName} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-semibold text-white">
                        {s.firstName?.[0]}{s.lastName?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.firstName} {s.lastName}</p>
                    <p className="text-xs text-muted-foreground">{s.admissionNo} · {s.class_name || '—'}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setUploadTarget(s); setPhotoPreview(s.photoUrl || '') }} aria-label="Upload photo">
                      <Camera className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openIDCard(s.id)}>
                      <ExternalLink className="mr-1 h-3 w-3" /> Card
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Photo Upload Dialog */}
      <Dialog open={!!uploadTarget} onOpenChange={() => { setUploadTarget(null); setPhotoPreview('') }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Camera className="h-5 w-5 text-emerald-600" /> Upload Photo</DialogTitle>
            <DialogDescription>
              {uploadTarget && `Upload a photo for ${uploadTarget.firstName} ${uploadTarget.lastName} (${uploadTarget.admissionNo})`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-col items-center gap-3">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="h-32 w-32 rounded-lg object-cover border-2 border-emerald-300" />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-muted border-2 border-dashed border-muted-foreground/30">
                  <Camera className="h-10 w-10 text-muted-foreground/40" />
                </div>
              )}
              <Label htmlFor="photo-input" className="cursor-pointer">
                <div className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-muted">
                  <Upload className="h-4 w-4" /> Choose Image
                </div>
              </Label>
              <Input id="photo-input" type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
              <p className="text-[10px] text-muted-foreground">Max 500KB · JPG/PNG · Square image recommended</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadTarget(null); setPhotoPreview('') }}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={!photoPreview || uploading} onClick={handlePhotoUpload}>
              {uploading ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Uploading...</> : <><Upload className="mr-1.5 h-4 w-4" /> Upload</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info banner */}
      <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
        <p className="text-xs text-emerald-700 dark:text-emerald-400">
          <strong>ID Card Features:</strong> Each card includes the school logo, student photo, admission number, class, stream,
          boarding/day status, and a QR code. The QR code encodes the student's ID and can be scanned at the biometric gate for check-in.
          Use "Print All" to generate a batch of all ID cards on one page for bulk printing.
        </p>
      </div>
    </div>
  )
}
