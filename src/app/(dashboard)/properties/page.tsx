'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Home,
  MapPin,
  Users,
  BedDouble,
  Bath,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Property, Owner, PropertyType, PropertyStatus } from '@/lib/supabase/types'

const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
  INACTIVE: { label: 'Inactive', color: 'bg-slate-100 text-slate-700' },
  MAINTENANCE: { label: 'Maintenance', color: 'bg-amber-100 text-amber-700' },
}

const typeLabels: Record<string, string> = {
  STUDIO: 'Studio',
  APARTMENT: 'Appartement',
  HOUSE: 'Maison',
  VILLA: 'Villa',
}

const emptyForm = {
  name: '',
  address: '',
  city: '',
  zipcode: '',
  type: 'APARTMENT' as PropertyType,
  capacity: 4,
  bedrooms: 1,
  beds: 1,
  bathrooms: 1,
  surface_m2: '',
  owner_id: '',
  access_code: '',
  wifi_name: '',
  wifi_password: '',
  access_instructions: '',
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [owners, setOwners] = useState<Owner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const [propRes, ownerRes] = await Promise.all([
      supabase.from('properties').select('*').order('name'),
      supabase.from('owners').select('*').order('full_name'),
    ])
    setProperties((propRes.data as Property[]) ?? [])
    setOwners((ownerRes.data as Owner[]) ?? [])
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const ownerMap = useMemo(
    () => new Map(owners.map((o) => [o.id, o.full_name])),
    [owners]
  )

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.city.toLowerCase().includes(q) &&
          !p.address.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [properties, statusFilter, search])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: properties.length }
    for (const p of properties) {
      c[p.status] = (c[p.status] ?? 0) + 1
    }
    return c
  }, [properties])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.address || !form.city || !form.zipcode || !form.owner_id) {
      setError('Veuillez remplir tous les champs obligatoires.')
      return
    }
    setSaving(true)
    setError(null)

    const owner = owners.find((o) => o.id === form.owner_id)
    if (!owner) { setError('Propriétaire introuvable.'); setSaving(false); return }

    const { error: err } = await supabase.from('properties').insert({
      organization_id: owner.organization_id,
      owner_id: form.owner_id,
      name: form.name,
      address: form.address,
      city: form.city,
      zipcode: form.zipcode,
      type: form.type,
      capacity: form.capacity,
      bedrooms: form.bedrooms,
      beds: form.beds,
      bathrooms: form.bathrooms,
      surface_m2: form.surface_m2 ? Number(form.surface_m2) : null,
      access_code: form.access_code || null,
      wifi_name: form.wifi_name || null,
      wifi_password: form.wifi_password || null,
      access_instructions: form.access_instructions || null,
      status: 'ACTIVE' as PropertyStatus,
      rules: [],
      amenities: [],
      platforms: {},
      photos: [],
    })

    setSaving(false)
    if (err) { setError(err.message); return }
    setForm(emptyForm)
    setDialogOpen(false)
    fetchData()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Propriétés</h1>
          <p className="text-sm text-muted-foreground">
            {properties.length} propriété{properties.length > 1 ? 's' : ''} au total
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => { setForm(emptyForm); setError(null); setDialogOpen(true) }}>
          <Plus className="h-3.5 w-3.5" />
          Nouvelle propriété
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'Toutes' },
          { value: 'ACTIVE', label: 'Actives' },
          { value: 'INACTIVE', label: 'Inactives' },
          { value: 'MAINTENANCE', label: 'Maintenance' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              statusFilter === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {tab.label}
            {(counts[tab.value] ?? 0) > 0 && (
              <span className={cn('text-xs', statusFilter === tab.value ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                {counts[tab.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un nom, une ville, une adresse..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl border border-border bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
          <Home className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium">Aucune propriété trouvée</p>
          <p className="text-xs text-muted-foreground mt-1">Modifiez vos filtres ou ajoutez une propriété</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const status = statusConfig[p.status] ?? statusConfig.ACTIVE
            return (
              <Link
                key={p.id}
                href={`/properties/${p.id}`}
                className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold group-hover:text-accent transition-colors">{p.name}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {p.city}
                    </p>
                  </div>
                  <Badge className={cn('text-xs', status.color)}>{status.label}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Home className="h-3 w-3" />
                    {typeLabels[p.type] ?? p.type}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {p.capacity}
                  </span>
                  <span className="flex items-center gap-1">
                    <BedDouble className="h-3 w-3" />
                    {p.bedrooms}ch
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="h-3 w-3" />
                    {p.bathrooms}
                  </span>
                </div>
                {p.surface_m2 && (
                  <p className="mt-1 text-xs text-muted-foreground">{p.surface_m2} m²</p>
                )}
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Propriétaire : {ownerMap.get(p.owner_id) ?? '—'}
                </p>
              </Link>
            )
          })}
        </div>
      )}

      {/* Dialog Create */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle propriété</DialogTitle>
            <DialogDescription>Ajoutez un logement à votre portefeuille.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nom *</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Appt Mer Bleue" />
              </div>
              <div className="space-y-1.5">
                <Label>Propriétaire *</Label>
                <Select value={form.owner_id} onValueChange={(v) => setForm((f) => ({ ...f, owner_id: v ?? '' }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Choisir" /></SelectTrigger>
                  <SelectContent>
                    {owners.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Adresse *</Label>
              <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="12 rue de la Plage" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ville *</Label>
                <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="Biarritz" />
              </div>
              <div className="space-y-1.5">
                <Label>Code postal *</Label>
                <Input value={form.zipcode} onChange={(e) => setForm((f) => ({ ...f, zipcode: e.target.value }))} placeholder="64200" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: (v ?? 'APARTMENT') as PropertyType }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDIO">Studio</SelectItem>
                    <SelectItem value="APARTMENT">Appartement</SelectItem>
                    <SelectItem value="HOUSE">Maison</SelectItem>
                    <SelectItem value="VILLA">Villa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Surface (m²)</Label>
                <Input type="number" value={form.surface_m2} onChange={(e) => setForm((f) => ({ ...f, surface_m2: e.target.value }))} placeholder="65" />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label>Capacité</Label>
                <Input type="number" min={1} value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Chambres</Label>
                <Input type="number" min={0} value={form.bedrooms} onChange={(e) => setForm((f) => ({ ...f, bedrooms: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Lits</Label>
                <Input type="number" min={1} value={form.beds} onChange={(e) => setForm((f) => ({ ...f, beds: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>SdB</Label>
                <Input type="number" min={1} value={form.bathrooms} onChange={(e) => setForm((f) => ({ ...f, bathrooms: Number(e.target.value) }))} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Code accès</Label>
                <Input value={form.access_code} onChange={(e) => setForm((f) => ({ ...f, access_code: e.target.value }))} placeholder="1234#" />
              </div>
              <div className="space-y-1.5">
                <Label>WiFi nom</Label>
                <Input value={form.wifi_name} onChange={(e) => setForm((f) => ({ ...f, wifi_name: e.target.value }))} placeholder="MerBleue-5G" />
              </div>
              <div className="space-y-1.5">
                <Label>WiFi mdp</Label>
                <Input value={form.wifi_password} onChange={(e) => setForm((f) => ({ ...f, wifi_password: e.target.value }))} placeholder="••••••" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Instructions d'accès</Label>
              <Textarea value={form.access_instructions} onChange={(e) => setForm((f) => ({ ...f, access_instructions: e.target.value }))} placeholder="La boîte à clé se trouve..." className="min-h-16 resize-none" />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button type="submit" disabled={saving} className="gap-1.5">
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
