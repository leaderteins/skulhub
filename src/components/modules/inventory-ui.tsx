'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Package, Plus, Search } from 'lucide-react'

export function InventoryTracker() {
  const [assets, setAssets] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newAsset, setNewAsset] = useState({ name: '', category: 'General', serialNumber: '', condition: 'Good', location: '', value: 0 })

  useEffect(() => {
    fetch('/api/inventory-assets').then(r => r.json()).then(d => { setAssets(d.assets || []); setCategories(d.categories || []) }).catch(() => {})
  }, [])

  const addAsset = async () => {
    await fetch('/api/inventory-assets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAsset) })
    setShowAdd(false); setNewAsset({ name: '', category: 'General', serialNumber: '', condition: 'Good', location: '', value: 0 })
    fetch('/api/inventory-assets').then(r => r.json()).then(d => { setAssets(d.assets || []); setCategories(d.categories || []) })
  }

  const filtered = assets.filter(a => (!filter || filter === 'all' || a.category === filter) && (!search || a.name?.toLowerCase().includes(search.toLowerCase())))
  const totalValue = filtered.reduce((s, a) => s + Number(a.value || 0), 0)

  const CONDITION_COLORS: Record<string, string> = { Good: 'bg-emerald-100 text-emerald-700', Fair: 'bg-amber-100 text-amber-700', Poor: 'bg-rose-100 text-rose-700', Damaged: 'bg-rose-100 text-rose-700' }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Package className="h-6 w-6 text-emerald-600" /><h1 className="text-2xl font-bold">Inventory & Assets</h1></div><Button onClick={() => setShowAdd(!showAdd)} className="bg-emerald-600"><Plus className="mr-1 h-4 w-4" /> Add Asset</Button></div>
      <div className="grid gap-4 sm:grid-cols-3"><Card><CardContent className="p-4"><p className="text-2xl font-bold">{assets.length}</p><p className="text-xs text-muted-foreground">Total assets</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-2xl font-bold">KES {totalValue.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total value</p></CardContent></Card><Card><CardContent className="p-4"><p className="text-2xl font-bold">{categories.length}</p><p className="text-xs text-muted-foreground">Categories</p></CardContent></Card></div>
      {showAdd && <Card><CardContent className="space-y-2 p-4"><div className="grid gap-2 sm:grid-cols-2"><Input placeholder="Asset name" value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} /><Input placeholder="Serial number" value={newAsset.serialNumber} onChange={e => setNewAsset({...newAsset, serialNumber: e.target.value})} /><Input placeholder="Location" value={newAsset.location} onChange={e => setNewAsset({...newAsset, location: e.target.value})} /><Input type="number" placeholder="Value (KES)" value={newAsset.value} onChange={e => setNewAsset({...newAsset, value: Number(e.target.value)})} /></div><Button onClick={addAsset} className="bg-emerald-600">Save Asset</Button></CardContent></Card>}
      <div className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div><Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Categories</SelectItem>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
      <div className="grid gap-2">{filtered.map(a => <Card key={a.id}><CardContent className="flex items-center justify-between p-3"><div><p className="font-medium text-sm">{a.name}</p><p className="text-xs text-muted-foreground">{a.category} · {a.serialnumber || a.serialNumber || 'No serial'} · {a.location || 'No location'}</p></div><div className="flex items-center gap-2"><Badge className={CONDITION_COLORS[a.condition] || CONDITION_COLORS.Good} variant="secondary">{a.condition}</Badge><span className="text-sm font-bold">KES {Number(a.value || 0).toLocaleString()}</span></div></CardContent></Card>)}</div>
    </div>
  )
}
