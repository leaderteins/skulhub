'use client'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Camera, ChevronLeft, ChevronRight, X } from 'lucide-react'

const GALLERY_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1497486751825-436074290308?w=800&q=80', alt: 'African school children in classroom', caption: 'Students engaged in learning', category: 'Classroom' },
  { url: 'https://images.unsplash.com/photo-1503676260723-1e9bb3a0a1c4?w=800&q=80', alt: 'School office with computers', caption: 'Modern school administration office', category: 'Office' },
  { url: 'https://images.unsplash.com/photo-1571260889-47ba4e0e8e5c?w=800&q=80', alt: 'Students using laptops in school', caption: 'Digital learning in action', category: 'Technology' },
  { url: 'https://images.unsplash.com/photo-1524178232363-1fb8d3640e3a?w=800&q=80', alt: 'School library with books', caption: 'School library management', category: 'Library' },
  { url: 'https://images.unsplash.com/photo-1588413801467-0c5f4d4a3b1e?w=800&q=80', alt: 'School sports field', caption: 'Sports and extracurricular activities', category: 'Sports' },
  { url: 'https://images.unsplash.com/photo-1577896851234-1b1b0a8d4e3c?w=800&q=80', alt: 'School bus transport', caption: 'Bus tracking & transport management', category: 'Transport' },
  { url: 'https://images.unsplash.com/photo-1554180262-2c4c1e8b0e3a?w=800&q=80', alt: 'Teachers in staff room', caption: 'Staff management & payroll', category: 'Staff' },
  { url: 'https://images.unsplash.com/photo-1580582932711-9f1e6f9e3a1c?w=800&q=80', alt: 'School science laboratory', caption: 'Science lab & practical lessons', category: 'Academics' },
  { url: 'https://images.unsplash.com/photo-1591115765373-1e5c5b4e3a2d?w=800&q=80', alt: 'School graduation ceremony', caption: 'Track student progress to graduation', category: 'Achievement' },
  { url: 'https://images.unsplash.com/photo-1586769478453-1e3c5a0e8e5c?w=800&q=80', alt: 'Parent teacher meeting', caption: 'Parent-teacher communication portal', category: 'Parents' },
  { url: 'https://images.unsplash.com/photo-1565684348a3-85b4f3e3e2e1?w=800&q=80', alt: 'School cafeteria dining', caption: 'Cafeteria & meal management', category: 'Cafeteria' },
  { url: 'https://images.unsplash.com/photo-1606761568525-2e3e3e3e3e3e?w=800&q=80', alt: 'School health clinic', caption: 'Health & wellness tracking', category: 'Health' },
]

const CATEGORY_COLORS: Record<string, string> = {
  Classroom: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Office: 'border-teal-300 bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
  Technology: 'border-cyan-300 bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
  Library: 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Sports: 'border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  Transport: 'border-violet-300 bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  Staff: 'border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
  Academics: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Achievement: 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Parents: 'border-teal-300 bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
  Cafeteria: 'border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  Health: 'border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
}

export function ImageGallery() {
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [filter, setFilter] = useState<string | null>(null)

  const categories = Array.from(new Set(GALLERY_IMAGES.map(i => i.category)))
  const images = filter ? GALLERY_IMAGES.filter(i => i.category === filter) : GALLERY_IMAGES

  return (
    <section id="gallery" className="scroll-mt-20 bg-gradient-to-b from-white to-emerald-50/50 py-16 dark:from-slate-950 dark:to-emerald-950/20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-8 text-center">
          <Badge variant="outline" className="mb-3 border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            <Camera className="mr-1.5 h-3 w-3" /> Gallery
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight">See SkulHub in Action</h2>
          <p className="mt-2 text-sm text-muted-foreground">Real school photos — classrooms, offices, libraries, transport, sports, and more</p>
        </div>

        {/* Category filters */}
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          <Button size="sm" variant={filter === null ? 'default' : 'outline'} onClick={() => setFilter(null)} className={filter === null ? 'bg-emerald-600' : ''}>All</Button>
          {categories.map(cat => (
            <Button key={cat} size="sm" variant={filter === cat ? 'default' : 'outline'} onClick={() => setFilter(cat)} className={filter === cat ? 'bg-emerald-600' : ''}>{cat}</Button>
          ))}
        </div>

        {/* Image grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => (
            <Card key={i} className="group cursor-pointer overflow-hidden p-0 transition-all hover:shadow-lg" onClick={() => setLightbox(i)}>
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={img.url} alt={img.alt} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <Badge className={CATEGORY_COLORS[img.category] || CATEGORY_COLORS.Classroom} variant="secondary">{img.category}</Badge>
                  <p className="mt-1 text-xs font-medium text-white">{img.caption}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setLightbox(null)}>
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" onClick={() => setLightbox(null)}><X className="h-5 w-5" /></button>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); setLightbox(Math.max(0, lightbox - 1)) }}><ChevronLeft className="h-6 w-6" /></button>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); setLightbox(Math.min(images.length - 1, lightbox + 1)) }}><ChevronRight className="h-6 w-6" /></button>
          <div className="max-h-[90vh] max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <img src={images[lightbox].url} alt={images[lightbox].alt} className="max-h-[80vh] rounded-xl object-contain" />
            <div className="mt-3 text-center">
              <Badge className={CATEGORY_COLORS[images[lightbox].category] || CATEGORY_COLORS.Classroom} variant="secondary">{images[lightbox].category}</Badge>
              <p className="mt-2 text-sm font-medium text-white">{images[lightbox].caption}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
