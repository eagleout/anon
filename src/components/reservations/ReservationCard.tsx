'use client'

import Link from 'next/link'
import { CalendarDays, User, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { formatDateShort } from '@/lib/utils/dates'
import { formatCurrency, formatNights } from '@/lib/utils/formatting'
import type { Reservation } from '@/lib/supabase/types'

const statusConfig: Record<string, { label: string; variant: string }> = {
  PENDING: { label: 'En attente', variant: 'bg-slate-100 text-slate-700' },
  CONFIRMED: { label: 'Confirmée', variant: 'bg-blue-100 text-blue-700' },
  CHECKED_IN: { label: 'Check-in', variant: 'bg-emerald-100 text-emerald-700' },
  CHECKED_OUT: { label: 'Check-out', variant: 'bg-purple-100 text-purple-700' },
  CANCELLED: { label: 'Annulée', variant: 'bg-red-100 text-red-700' },
}

const platformConfig: Record<string, { label: string; color: string }> = {
  AIRBNB: { label: 'Airbnb', color: 'text-rose-600' },
  BOOKING: { label: 'Booking', color: 'text-blue-600' },
  VRBO: { label: 'VRBO', color: 'text-indigo-600' },
  DIRECT: { label: 'Direct', color: 'text-emerald-600' },
  MANUAL: { label: 'Manuel', color: 'text-slate-600' },
}

interface ReservationCardProps {
  reservation: Reservation
  propertyName?: string
}

export function ReservationCard({ reservation, propertyName }: ReservationCardProps) {
  const status = statusConfig[reservation.status] ?? statusConfig.PENDING
  const platform = platformConfig[reservation.platform] ?? platformConfig.MANUAL

  return (
    <Link
      href={`/reservations/${reservation.id}`}
      className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold truncate">
              {reservation.guest_name}
            </h3>
            <Badge className={cn('text-xs shrink-0', status.variant)}>
              {status.label}
            </Badge>
          </div>
          {propertyName && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {propertyName}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {formatDateShort(reservation.checkin_date)} → {formatDateShort(reservation.checkout_date)}
            </span>
            <span>{formatNights(reservation.checkin_date, reservation.checkout_date)}</span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {reservation.guest_count}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold">
            {formatCurrency(reservation.amount_gross)}
          </p>
          <p className={cn('text-xs font-medium', platform.color)}>
            {platform.label}
          </p>
        </div>
      </div>
    </Link>
  )
}
