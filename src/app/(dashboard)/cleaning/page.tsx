'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  MapPin,
  CalendarDays,
  Loader2,
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
import { formatDate, formatSmartDate } from '@/lib/utils/dates'
import type { CleaningMission, Property, User as UserType, CleaningType, CleaningStatus } from '@/lib/supabase/types'

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  PENDING: { label: 'En attente', color: 'bg-slate-100 text-slate-700', icon: Clock },
  ASSIGNED: { label: 'Assignée', color: 'bg-blue-100 text-blue-700', icon: User },
  IN_PROGRESS: { label: 'En cours', color: 'bg-amber-100 text-amber-700', icon: Sparkles },
  COMPLETED: { label: 'Terminée', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  ISSUE: { label: 'Problème', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
}

const typeLabels: Record<string, string> = {
  FULL_CLEANING: 'Ménage complet',
  QUICK_CHECK: 'Vérification rapide',
  MAINTENANCE: 'Maintenance',
}

export default function CleaningPage() {
  const [missions, setMissions] = useState<CleaningMission[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [agents, setAgents] = useState<UserType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    property_id: '',
    type: 'FULL_CLEANING' as CleaningType,
    scheduled_date: '',
    assigned_to: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const [missRes, propRes, agentRes] = await Promise.all([
      supabase.from('cleaning_missions').select('*').order('scheduled_date', { ascending: true }),
      supabase.from('properties').select('id, name, organization_id').order('name'),
      supabase.from('users').select('*').eq('role', 'AGENT_MENAGE').order('full_name'),
    ])
    setMissions((missRes.data as CleaningMission[]) ?? [])
    setProperties((propRes.data as Property[]) ?? [])
    setAgents((agentRes.data as UserType[]) ?? [])
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const propMap = useMemo(() => new Map(properties.map((p) => [p.id, p.name])), [properties])
  const agentMap = useMemo(() => new Map(agents.map((a) => [a.id, a.full_name])), [agents])

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return missions
    return missions.filter((m) => m.status === statusFilter)
  }, [missions, statusFilter])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: missions.length }
    for (const m of missions) c[m.status] = (c[m.status] ?? 0) + 1
    return c
  }, [missions])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.property_id || !form.scheduled_date) {
      setError('Propriété et date sont obligatoires.')
      return
    }
    setSaving(true)
    setError(null)

    const prop = properties.find((p) => p.id === form.property_id)
    if (!prop) { setError('Propriété introuvable.'); setSaving(false); return }

    const { error: err } = await supabase.from('cleaning_missions').insert({
      property_id: form.property_id,
      organization_id: prop.organization_id,
      type: form.type,
      scheduled_date: form.scheduled_date,
      assigned_to: form.assigned_to || null,
      status: form.assigned_to ? 'ASSIGNED' : 'PENDING',
      notes: form.notes || null,
      checklist_items: [],
    })

    setSaving(false)
    if (err) { setError(err.message); return }
    setDialogOpen(false)
    fetchData()
  }

  async function updateMissionStatus(missionId: string, newStatus: CleaningStatus) {
    await supabase.from('cleaning_missions').update({ status: newStatus }).eq('id', missionId)
    fetchData()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ménage & Inspections</h1>
          <p className="text-sm text-muted-foreground">
            {missions.length} mission{missions.length > 1 ? 's' : ''} au total
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => { setError(null); setDialogOpen(true) }}>
          <Plus className="h-3.5 w-3.5" />
          Nouvelle mission
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'Toutes' },
          { value: 'PENDING', label: 'En attente' },
          { value: 'ASSIGNED', label: 'Assignées' },
          { value: 'IN_PROGRESS', label: 'En cours' },
          { value: 'COMPLETED', label: 'Terminées' },
          { value: 'ISSUE', label: 'Problèmes' },
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

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
          <Sparkles className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium">Aucune mission</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => {
            const cfg = statusConfig[m.status] ?? statusConfig.PENDING
            const StatusIcon = cfg.icon
            return (
              <div key={m.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-full shrink-0', cfg.color)}>
                  <StatusIcon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold truncate">{propMap.get(m.property_id) ?? 'Propriété'}</span>
                    <Badge className={cn('text-[10px]', cfg.color)}>{cfg.label}</Badge>
                    <Badge variant="outline" className="text-[10px]">{typeLabels[m.type]}</Badge>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {formatSmartDate(m.scheduled_date)}
                    </span>
                    {m.assigned_to && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {agentMap.get(m.assigned_to) ?? 'Agent'}
                      </span>
                    )}
                  </div>
                  {m.notes && <p className="mt-1 text-xs text-muted-foreground truncate">{m.notes}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  {m.status === 'PENDING' && (
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => updateMissionStatus(m.id, 'IN_PROGRESS')}>
                      Démarrer
                    </Button>
                  )}
                  {m.status === 'ASSIGNED' && (
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => updateMissionStatus(m.id, 'IN_PROGRESS')}>
                      Démarrer
                    </Button>
                  )}
                  {m.status === 'IN_PROGRESS' && (
                    <>
                      <Button size="sm" className="text-xs" onClick={() => updateMissionStatus(m.id, 'COMPLETED')}>
                        Terminer
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs text-destructive" onClick={() => updateMissionStatus(m.id, 'ISSUE')}>
                        Problème
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Dialog Create */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle mission de ménage</DialogTitle>
            <DialogDescription>Planifiez une intervention de ménage ou maintenance.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Propriété *</Label>
              <Select value={form.property_id} onValueChange={(v) => setForm((f) => ({ ...f, property_id: v ?? '' }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: (v ?? 'FULL_CLEANING') as CleaningType }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_CLEANING">Ménage complet</SelectItem>
                    <SelectItem value="QUICK_CHECK">Vérification</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" value={form.scheduled_date} onChange={(e) => setForm((f) => ({ ...f, scheduled_date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Assigner à</Label>
              <Select value={form.assigned_to} onValueChange={(v) => setForm((f) => ({ ...f, assigned_to: v ?? '' }))}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Non assigné" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Non assigné</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Instructions spéciales..." className="min-h-16 resize-none" />
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
