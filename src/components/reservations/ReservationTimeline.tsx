'use client'

import {
  Calendar,
  CheckCircle2,
  LogIn,
  LogOut,
  XCircle,
  Sparkles,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate, formatTime } from '@/lib/utils/dates'
import type { Reservation } from '@/lib/supabase/types'

interface TimelineEvent {
  id: string
  icon: typeof Calendar
  color: string
  title: string
  date: string
  description?: string
  active: boolean
}

function buildTimeline(reservation: Reservation): TimelineEvent[] {
  const events: TimelineEvent[] = []
  const status = reservation.status

  events.push({
    id: 'created',
    icon: Calendar,
    color: 'text-slate-500',
    title: 'Réservation créée',
    date: formatDate(reservation.created_at),
    active: true,
  })

  const isConfirmed = ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'].includes(status)
  events.push({
    id: 'confirmed',
    icon: CheckCircle2,
    color: isConfirmed ? 'text-blue-500' : 'text-slate-300',
    title: 'Confirmée',
    date: isConfirmed ? formatDate(reservation.updated_at) : '—',
    active: isConfirmed,
  })

  const isCheckedIn = ['CHECKED_IN', 'CHECKED_OUT'].includes(status)
  events.push({
    id: 'checkin',
    icon: LogIn,
    color: isCheckedIn ? 'text-emerald-500' : 'text-slate-300',
    title: 'Check-in',
    date: `${formatDate(reservation.checkin_date)} à ${formatTime(reservation.checkin_time)}`,
    active: isCheckedIn,
  })

  const isCheckedOut = status === 'CHECKED_OUT'
  events.push({
    id: 'checkout',
    icon: LogOut,
    color: isCheckedOut ? 'text-purple-500' : 'text-slate-300',
    title: 'Check-out',
    date: `${formatDate(reservation.checkout_date)} à ${formatTime(reservation.checkout_time)}`,
    active: isCheckedOut,
  })

  if (status === 'CANCELLED') {
    events.push({
      id: 'cancelled',
      icon: XCircle,
      color: 'text-red-500',
      title: 'Annulée',
      date: formatDate(reservation.updated_at),
      active: true,
    })
  }

  return events
}

export function ReservationTimeline({ reservation }: { reservation: Reservation }) {
  const events = buildTimeline(reservation)

  return (
    <div className="space-y-0">
      {events.map((event, index) => {
        const Icon = event.icon
        const isLast = index === events.length - 1
        return (
          <div key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                  event.active
                    ? 'border-current bg-white'
                    : 'border-slate-200 bg-slate-50'
                )}
              >
                <Icon className={cn('h-4 w-4', event.color)} />
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'w-px flex-1 min-h-6',
                    event.active ? 'bg-slate-300' : 'bg-slate-100'
                  )}
                />
              )}
            </div>
            <div className="pb-4">
              <p
                className={cn(
                  'text-sm font-medium',
                  event.active ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {event.title}
              </p>
              <p className="text-xs text-muted-foreground">{event.date}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
