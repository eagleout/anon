'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  MapPin,
  Home,
  Users,
  BedDouble,
  Bath,
  Key,
  Wifi,
  Pencil,
  CalendarDays,
  Euro,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/dates'
import { formatCurrency } from '@/lib/utils/formatting'
import type { Property, Reservation, Owner, PropertyStatus } from '@/lib/supabase/types'

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

export default function PropertyDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [property, setProperty] = useState<Property | null>(null)
  const [owner, setOwner] = useState<Owner | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data: prop } = await supabase.from('properties').select('*').eq('id', id).single()
    if (prop) {
      const p = prop as Property
      setProperty(p)
      const [ownerRes, resaRes] = await Promise.all([
        supabase.from('owners').select('*').eq('id', p.owner_id).single(),
        supabase.from('reservations').select('*').eq('property_id', p.id).order('checkin_date', { ascending: false }).limit(10),
      ])
      setOwner(ownerRes.data as Owner | null)
      setReservations((resaRes.data as Reservation[]) ?? [])
    }
    setIsLoading(false)
  }, [id, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function updateStatus(status: PropertyStatus) {
    if (!property) return
    await supabase.from('properties').update({ status }).eq('id', property.id)
    setProperty({ ...property, status })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center py-16">
        <p className="text-sm text-muted-foreground">Propriété introuvable</p>
        <Button variant="outline" size="sm" className="mt-4" render={<Link href="/properties" />}>Retour</Button>
      </div>
    )
  }

  const status = statusConfig[property.status] ?? statusConfig.ACTIVE

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link href="/properties" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{property.name}</h1>
            <Badge className={cn('text-xs', status.color)}>{status.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {property.address}, {property.zipcode} {property.city}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={property.status} onValueChange={(v) => updateStatus((v ?? 'ACTIVE') as PropertyStatus)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Col principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Caractéristiques */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Caractéristiques</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="flex items-center gap-2 text-sm">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span>{typeLabels[property.type]}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{property.capacity} voyageurs</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <BedDouble className="h-4 w-4 text-muted-foreground" />
                <span>{property.bedrooms} ch / {property.beds} lit{property.beds > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Bath className="h-4 w-4 text-muted-foreground" />
                <span>{property.bathrooms} sdb</span>
              </div>
            </div>
            {property.surface_m2 && (
              <p className="mt-3 text-sm text-muted-foreground">Surface : {property.surface_m2} m²</p>
            )}
          </div>

          {/* Accès & WiFi */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Accès & Connectivité</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {property.access_code && (
                <div className="flex items-center gap-2 text-sm">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <span>Code : <span className="font-mono font-medium">{property.access_code}</span></span>
                </div>
              )}
              {property.wifi_name && (
                <div className="flex items-center gap-2 text-sm">
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                  <span>{property.wifi_name} / <span className="font-mono">{property.wifi_password}</span></span>
                </div>
              )}
            </div>
            {property.access_instructions && (
              <>
                <Separator className="my-4" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Instructions d'accès</p>
                  <p className="text-sm whitespace-pre-wrap">{property.access_instructions}</p>
                </div>
              </>
            )}
          </div>

          {/* Dernières réservations */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Dernières réservations</h2>
            {reservations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune réservation</p>
            ) : (
              <div className="space-y-2">
                {reservations.map((r) => (
                  <Link
                    key={r.id}
                    href={`/reservations/${r.id}`}
                    className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{r.guest_name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(r.checkin_date)} → {formatDate(r.checkout_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(r.amount_gross)}</p>
                      <Badge variant="outline" className="text-[10px]">{r.status}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Col droite */}
        <div className="space-y-6">
          {/* Propriétaire */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Propriétaire</h2>
            {owner ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium">{owner.full_name}</p>
                {owner.email && <p className="text-muted-foreground">{owner.email}</p>}
                {owner.phone && <p className="text-muted-foreground">{owner.phone}</p>}
                <Badge variant="outline" className="text-xs">{owner.communication_profile}</Badge>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Non assigné</p>
            )}
          </div>

          {/* Plateformes */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Calendriers iCal</h2>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Airbnb</p>
                <p className="text-xs font-mono truncate">{property.ical_airbnb || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Booking</p>
                <p className="text-xs font-mono truncate">{property.ical_booking || '—'}</p>
              </div>
            </div>
          </div>

          {/* Infos */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Informations</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Créé le</span>
                <span>{formatDate(property.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modifié le</span>
                <span>{formatDate(property.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
