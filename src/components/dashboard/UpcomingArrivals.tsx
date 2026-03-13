'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, PlaneLanding, PlaneTakeoff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Reservation } from '@/lib/supabase/types'

function ArrivalDepartureCard({
  type,
  count,
  guests,
  isLoading,
}: {
  type: 'arrival' | 'departure'
  count: number
  guests: string[]
  isLoading: boolean
}) {
  const isArrival = type === 'arrival'
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {isArrival ? "Arrivées aujourd'hui" : "Départs aujourd'hui"}
          </p>
          {isLoading ? (
            <div className="mt-1 h-8 w-8 animate-pulse rounded bg-muted" />
          ) : (
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {count}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {isLoading
              ? ''
              : count > 0
                ? guests.slice(0, 2).join(', ') +
                  (guests.length > 2 ? ` +${guests.length - 2}` : '')
                : isArrival
                  ? 'Aucune arrivée prévue'
                  : 'Aucun départ prévu'}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
          {isArrival ? (
            <PlaneLanding className="h-5 w-5 text-accent" />
          ) : (
            <PlaneTakeoff className="h-5 w-5 text-accent" />
          )}
        </div>
      </div>
    </div>
  )
}

export function UpcomingArrivals() {
  const [arrivals, setArrivals] = useState<Reservation[]>([])
  const [departures, setDepartures] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      const today = new Date().toISOString().split('T')[0]

      const [arrRes, depRes] = await Promise.all([
        supabase
          .from('reservations')
          .select('*')
          .eq('checkin_date', today)
          .neq('status', 'CANCELLED'),
        supabase
          .from('reservations')
          .select('*')
          .eq('checkout_date', today)
          .neq('status', 'CANCELLED'),
      ])

      setArrivals(arrRes.data ?? [])
      setDepartures(depRes.data ?? [])
      setIsLoading(false)
    }
    fetch()
  }, [supabase])

  return (
    <>
      <ArrivalDepartureCard
        type="arrival"
        count={arrivals.length}
        guests={arrivals.map((r) => r.guest_name)}
        isLoading={isLoading}
      />
      <ArrivalDepartureCard
        type="departure"
        count={departures.length}
        guests={departures.map((r) => r.guest_name)}
        isLoading={isLoading}
      />
    </>
  )
}
