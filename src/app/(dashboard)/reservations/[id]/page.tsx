'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Euro,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { ReservationTimeline } from '@/components/reservations/ReservationTimeline'
import { GuestMessages } from '@/components/reservations/GuestMessages'
import { formatDate, formatTime } from '@/lib/utils/dates'
import { formatCurrency, formatNights } from '@/lib/utils/formatting'
import type { Reservation, Property } from '@/lib/supabase/types'

const statusActions: Record<string, { label: string; next: string }> = {
  PENDING: { label: 'Confirmer', next: 'CONFIRMED' },
  CONFIRMED: { label: 'Check-in', next: 'CHECKED_IN' },
  CHECKED_IN: { label: 'Check-out', next: 'CHECKED_OUT' },
}

export default function ReservationDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      const { data: resa } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', id)
        .single()

      if (resa) {
        setReservation(resa as Reservation)
        const { data: prop } = await supabase
          .from('properties')
          .select('*')
          .eq('id', (resa as Reservation).property_id)
          .single()
        setProperty(prop as Property | null)
      }
      setIsLoading(false)
    }
    fetch()
  }, [id, supabase])

  async function updateStatus(newStatus: string) {
    if (!reservation) return
    await supabase
      .from('reservations')
      .update({ status: newStatus })
      .eq('id', reservation.id)
    setReservation({ ...reservation, status: newStatus as Reservation['status'] })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (!reservation) {
    return (
      <div className="flex flex-col items-center py-16">
        <p className="text-sm text-muted-foreground">R&eacute;servation introuvable</p>
        <Button variant="outline" size="sm" className="mt-4" render={<Link href="/reservations" />}>
          Retour
        </Button>
      </div>
    )
  }

  const action = statusActions[reservation.status]

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link href="/reservations" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{reservation.guest_name}</h1>
          <p className="text-sm text-muted-foreground">
            {property?.name} &middot; {formatDate(reservation.checkin_date)} → {formatDate(reservation.checkout_date)}
          </p>
        </div>
        <div className="flex gap-2">
          {action && (
            <Button size="sm" onClick={() => updateStatus(action.next)}>
              {action.label}
            </Button>
          )}
          {reservation.status !== 'CANCELLED' && reservation.status !== 'CHECKED_OUT' && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={() => updateStatus('CANCELLED')}
            >
              Annuler
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Col principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Infos voyageur */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Voyageur</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{reservation.guest_name}</span>
                <Badge variant="outline" className="text-xs">
                  {reservation.guest_count} pers.
                </Badge>
              </div>
              {reservation.guest_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{reservation.guest_email}</span>
                </div>
              )}
              {reservation.guest_phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{reservation.guest_phone}</span>
                </div>
              )}
              {property && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{property.address}, {property.city}</span>
                </div>
              )}
            </div>
            {reservation.notes && (
              <>
                <Separator className="my-4" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{reservation.notes}</p>
                </div>
              </>
            )}
          </div>

          {/* Messagerie */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Messages</h2>
            <GuestMessages
              reservationId={reservation.id}
              organizationId={reservation.organization_id}
            />
          </div>
        </div>

        {/* Col droite */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Timeline</h2>
            <ReservationTimeline reservation={reservation} />
          </div>

          {/* Finance */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Finances</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Montant brut</span>
                <span className="font-medium">{formatCurrency(reservation.amount_gross)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Commission plateforme</span>
                <span className="text-destructive">-{formatCurrency(reservation.platform_fee)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Commission conciergerie</span>
                <span className="text-destructive">-{formatCurrency(reservation.concierge_fee)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm font-semibold">
                <span>Net propri&eacute;taire</span>
                <span className="text-accent">{formatCurrency(reservation.amount_net)}</span>
              </div>
            </div>
          </div>

          {/* Séjour */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">S&eacute;jour</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Check-in</span>
                <span>{formatDate(reservation.checkin_date)} &agrave; {formatTime(reservation.checkin_time)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Check-out</span>
                <span>{formatDate(reservation.checkout_date)} &agrave; {formatTime(reservation.checkout_time)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dur&eacute;e</span>
                <span>{formatNights(reservation.checkin_date, reservation.checkout_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plateforme</span>
                <Badge variant="outline" className="text-xs">{reservation.platform}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
