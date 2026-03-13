'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Plus,
  Search,
  Users,
  Mail,
  Phone,
  Home,
  Loader2,
  Pencil,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils/formatting'
import type { Owner, Property, CommunicationProfile } from '@/lib/supabase/types'

const profileConfig: Record<string, { label: string; color: string }> = {
  DETAILED: { label: 'Détaillé', color: 'bg-blue-100 text-blue-700' },
  SUMMARY: { label: 'Résumé', color: 'bg-slate-100 text-slate-700' },
  URGENT_ONLY: { label: 'Urgent uniquement', color: 'bg-amber-100 text-amber-700' },
}

const emptyForm = {
  full_name: '',
  email: '',
  phone: '',
  iban: '',
  communication_profile: 'DETAILED' as CommunicationProfile,
  notes: '',
}

export default function OwnersPage() {
  const [owners, setOwners] = useState<Owner[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const [ownerRes, propRes] = await Promise.all([
      supabase.from('owners').select('*').order('full_name'),
      supabase.from('properties').select('id, name, owner_id').order('name'),
    ])
    setOwners((ownerRes.data as Owner[]) ?? [])
    setProperties((propRes.data as Property[]) ?? [])
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const propsByOwner = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const p of properties) {
      const list = map.get(p.owner_id) ?? []
      list.push(p.name)
      map.set(p.owner_id, list)
    }
    return map
  }, [properties])

  const filtered = useMemo(() => {
    if (!search) return owners
    const q = search.toLowerCase()
    return owners.filter(
      (o) =>
        o.full_name.toLowerCase().includes(q) ||
        (o.email ?? '').toLowerCase().includes(q)
    )
  }, [owners, search])

  function openNew() {
    setForm(emptyForm)
    setEditingId(null)
    setError(null)
    setDialogOpen(true)
  }

  function openEdit(owner: Owner) {
    setForm({
      full_name: owner.full_name,
      email: owner.email ?? '',
      phone: owner.phone ?? '',
      iban: owner.iban ?? '',
      communication_profile: owner.communication_profile,
      notes: owner.notes ?? '',
    })
    setEditingId(owner.id)
    setError(null)
    setDialogOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name) { setError('Le nom est obligatoire.'); return }
    setSaving(true)
    setError(null)

    if (editingId) {
      const { error: err } = await supabase.from('owners').update({
        full_name: form.full_name,
        email: form.email || null,
        phone: form.phone || null,
        iban: form.iban || null,
        communication_profile: form.communication_profile,
        notes: form.notes || null,
      }).eq('id', editingId)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      // Trouver l'organization_id
      const orgId = owners[0]?.organization_id
      let resolvedOrgId = orgId
      if (!resolvedOrgId) {
        const { data: u } = await supabase.from('users').select('organization_id').limit(1).single()
        resolvedOrgId = u?.organization_id
      }
      if (!resolvedOrgId) { setError('Organisation introuvable.'); setSaving(false); return }

      const { error: err } = await supabase.from('owners').insert({
        organization_id: resolvedOrgId,
        full_name: form.full_name,
        email: form.email || null,
        phone: form.phone || null,
        iban: form.iban || null,
        communication_profile: form.communication_profile,
        notes: form.notes || null,
        legal: {},
      })
      if (err) { setError(err.message); setSaving(false); return }
    }

    setSaving(false)
    setDialogOpen(false)
    fetchData()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Propriétaires</h1>
          <p className="text-sm text-muted-foreground">
            {owners.length} propriétaire{owners.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openNew}>
          <Plus className="h-3.5 w-3.5" />
          Nouveau propriétaire
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Rechercher un propriétaire..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
          <Users className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium">Aucun propriétaire</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o) => {
            const profile = profileConfig[o.communication_profile] ?? profileConfig.DETAILED
            const props = propsByOwner.get(o.id) ?? []
            return (
              <div key={o.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      {getInitials(o.full_name)}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{o.full_name}</h3>
                      <Badge className={cn('text-[10px]', profile.color)}>{profile.label}</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(o)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {o.email && (
                    <p className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3" />
                      {o.email}
                    </p>
                  )}
                  {o.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3" />
                      {o.phone}
                    </p>
                  )}
                  {props.length > 0 && (
                    <p className="flex items-center gap-1.5">
                      <Home className="h-3 w-3" />
                      {props.length} bien{props.length > 1 ? 's' : ''} : {props.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Dialog Create/Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifier' : 'Nouveau'} propriétaire</DialogTitle>
            <DialogDescription>Informations du propriétaire.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nom complet *</Label>
              <Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="Marie Martin" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="marie@email.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Téléphone</Label>
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+33 6..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>IBAN</Label>
                <Input value={form.iban} onChange={(e) => setForm((f) => ({ ...f, iban: e.target.value }))} placeholder="FR76..." />
              </div>
              <div className="space-y-1.5">
                <Label>Profil communication</Label>
                <Select value={form.communication_profile} onValueChange={(v) => setForm((f) => ({ ...f, communication_profile: (v ?? 'DETAILED') as CommunicationProfile }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DETAILED">Détaillé</SelectItem>
                    <SelectItem value="SUMMARY">Résumé</SelectItem>
                    <SelectItem value="URGENT_ONLY">Urgent uniquement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Notes internes..." className="min-h-16 resize-none" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={saving} className="gap-1.5">
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {editingId ? 'Enregistrer' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
