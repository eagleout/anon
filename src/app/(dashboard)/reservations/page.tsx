'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Search, Filter, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { ReservationCard } from '@/components/reservations/ReservationCard'
import { NewReservationDialog } from '@/components/reservations/NewReservationDialog'
import type { Reservation, Property } from '@/lib/supabase/types'

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [propertyFilter, setPropertyFilter] = useState('all')
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const [resaRes, propRes] = await Promise.all([
      supabase
        .from('reservations')
        .select('*')
        .order('checkin_date', { ascending: false }),
      supabase.from('properties').select('*').order('name'),
    ])

    setReservations((resaRes.data as Reservation[]) ?? [])
    setProperties((propRes.data as Property[]) ?? [])
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const propertyMap = useMemo(
    () => new Map(properties.map((p) => [p.id, p.name])),
    [properties]
  )

  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (platformFilter !== 'all' && r.platform !== platformFilter) return false
      if (propertyFilter !== 'all' && r.property_id !== propertyFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const name = r.guest_name.toLowerCase()
        const email = (r.guest_email ?? '').toLowerCase()
        const propName = (propertyMap.get(r.property_id) ?? '').toLowerCase()
        if (!name.includes(q) && !email.includes(q) && !propName.includes(q)) return false
      }
      return true
    })
  }, [reservations, statusFilter, platformFilter, propertyFilter, search, propertyMap])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: reservations.length }
    for (const r of reservations) {
      c[r.status] = (c[r.status] ?? 0) + 1
    }
    return c
  }, [reservations])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">R&eacute;servations</h1>
          <p className="text-sm text-muted-foreground">
            {reservations.length} r&eacute;servation{reservations.length > 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={fetchData}>
            <RefreshCw className="h-3.5 w-3.5" />
            Sync iCal
          </Button>
          <NewReservationDialog onCreated={fetchData} />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'Toutes' },
          { value: 'PENDING', label: 'En attente' },
          { value: 'CONFIRMED', label: 'Confirmées' },
          { value: 'CHECKED_IN', label: 'En cours' },
          { value: 'CHECKED_OUT', label: 'Terminées' },
          { value: 'CANCELLED', label: 'Annulées' },
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
              <span
                className={cn(
                  'text-xs',
                  statusFilter === tab.value
                    ? 'text-primary-foreground/70'
                    : 'text-muted-foreground'
                )}
              >
                {counts[tab.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un voyageur, email, propri&eacute;t&eacute;..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={platformFilter} onValueChange={(v) => setPlatformFilter(v ?? 'all')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Plateforme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="AIRBNB">Airbnb</SelectItem>
            <SelectItem value="BOOKING">Booking</SelectItem>
            <SelectItem value="VRBO">VRBO</SelectItem>
            <SelectItem value="DIRECT">Direct</SelectItem>
            <SelectItem value="MANUAL">Manuel</SelectItem>
          </SelectContent>
        </Select>
        <Select value={propertyFilter} onValueChange={(v) => setPropertyFilter(v ?? 'all')}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Propri&eacute;t&eacute;" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {properties.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-border bg-muted"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
          <Filter className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium">Aucune r&eacute;servation trouv&eacute;e</p>
          <p className="text-xs text-muted-foreground mt-1">
            Modifiez vos filtres ou cr&eacute;ez une nouvelle r&eacute;servation
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <ReservationCard
              key={r.id}
              reservation={r}
              propertyName={propertyMap.get(r.property_id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
