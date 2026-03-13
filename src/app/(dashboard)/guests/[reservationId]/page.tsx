'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, CalendarDays, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GuestMessages } from '@/components/reservations/GuestMessages'
import { createClient } from '@/lib/supabase/client'
import { formatDateShort } from '@/lib/utils/dates'
import { formatNights } from '@/lib/utils/formatting'
import type { Reservation, Property } from '@/lib/supabase/types'

export default function ConversationPage() {
  const params = useParams()
  const reservationId = params.reservationId as string
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      const { data: resa } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', reservationId)
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

      // Marquer les messages comme lus
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('reservation_id', reservationId)
        .eq('direction', 'INBOUND')
        .is('read_at', null)

      setIsLoading(false)
    }
    fetch()
  }, [reservationId, supabase])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  if (!reservation) {
    return (
      <div className="flex flex-col items-center py-16">
        <p className="text-sm text-muted-foreground">Conversation introuvable</p>
        <Button variant="outline" size="sm" className="mt-4" render={<Link href="/guests" />}>
          Retour
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link href="/guests" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold truncate">
              {reservation.guest_name}
            </h1>
            <Badge variant="outline" className="text-xs shrink-0">
              {reservation.platform}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {property && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {property.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {formatDateShort(reservation.checkin_date)} → {formatDateShort(reservation.checkout_date)}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {reservation.guest_count} pers.
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          render={<Link href={`/reservations/${reservation.id}`} />}
        >
          Voir r&eacute;servation
        </Button>
      </div>

      {/* Messages */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <GuestMessages
          reservationId={reservation.id}
          organizationId={reservation.organization_id}
        />
      </div>
    </div>
  )
}
