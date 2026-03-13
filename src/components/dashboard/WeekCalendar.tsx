'use client'

import { useEffect, useState } from 'react'
import { addDays, format, isSameDay, isWithinInterval } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Property, Reservation, CleaningMission } from '@/lib/supabase/types'

interface CalendarData {
  properties: Property[]
  reservations: Reservation[]
  missions: CleaningMission[]
}

function getCellStatus(
  propertyId: string,
  date: Date,
  reservations: Reservation[],
  missions: CleaningMission[]
): 'reserved' | 'cleaning' | 'free' {
  const dateStr = format(date, 'yyyy-MM-dd')

  // Ménage planifié ce jour
  const hasMission = missions.some(
    (m) => m.property_id === propertyId && m.scheduled_date === dateStr
  )
  if (hasMission) return 'cleaning'

  // Réservation couvrant ce jour
  const hasReservation = reservations.some(
    (r) =>
      r.property_id === propertyId &&
      isWithinInterval(date, {
        start: new Date(r.checkin_date),
        end: addDays(new Date(r.checkout_date), -1),
      })
  )
  if (hasReservation) return 'reserved'

  return 'free'
}

const statusColors = {
  reserved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cleaning: 'bg-amber-100 text-amber-700 border-amber-200',
  free: 'bg-red-50 text-red-400 border-red-100',
}

const statusLabels = {
  reserved: 'Réservé',
  cleaning: 'Ménage',
  free: 'Libre',
}

export function WeekCalendar() {
  const [data, setData] = useState<CalendarData>({
    properties: [],
    reservations: [],
    missions: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i))

  useEffect(() => {
    async function fetch() {
      const startStr = format(today, 'yyyy-MM-dd')
      const endStr = format(addDays(today, 7), 'yyyy-MM-dd')

      const [propRes, resaRes, missionRes] = await Promise.all([
        supabase
          .from('properties')
          .select('*')
          .eq('status', 'ACTIVE')
          .order('name'),
        supabase
          .from('reservations')
          .select('*')
          .neq('status', 'CANCELLED')
          .lte('checkin_date', endStr)
          .gte('checkout_date', startStr),
        supabase
          .from('cleaning_missions')
          .select('*')
          .gte('scheduled_date', startStr)
          .lte('scheduled_date', endStr),
      ])

      setData({
        properties: propRes.data ?? [],
        reservations: resaRes.data ?? [],
        missions: missionRes.data ?? [],
      })
      setIsLoading(false)
    }
    fetch()
  }, [supabase])

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-3">
        <h2 className="text-lg font-semibold">7 prochains jours</h2>
        <div className="mt-4 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-2">
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
              {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                <div
                  key={j}
                  className="h-8 flex-1 animate-pulse rounded bg-muted"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">7 prochains jours</h2>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            R&eacute;serv&eacute;
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            M&eacute;nage
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
            Libre
          </span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr>
              <th className="pb-2 pr-3 text-left text-xs font-medium text-muted-foreground">
                Propri&eacute;t&eacute;
              </th>
              {days.map((day) => (
                <th
                  key={day.toISOString()}
                  className={cn(
                    'pb-2 text-center text-xs font-medium',
                    isSameDay(day, today)
                      ? 'text-accent'
                      : 'text-muted-foreground'
                  )}
                >
                  <div>{format(day, 'EEE', { locale: fr })}</div>
                  <div className="text-[11px]">{format(day, 'd MMM', { locale: fr })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.properties.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  Aucune propri&eacute;t&eacute; active
                </td>
              </tr>
            ) : (
              data.properties.map((property) => (
                <tr key={property.id}>
                  <td className="py-1 pr-3 text-sm font-medium truncate max-w-[120px]">
                    {property.name}
                  </td>
                  {days.map((day) => {
                    const status = getCellStatus(
                      property.id,
                      day,
                      data.reservations,
                      data.missions
                    )
                    return (
                      <td key={day.toISOString()} className="p-0.5">
                        <div
                          className={cn(
                            'flex h-8 items-center justify-center rounded-md border text-xs font-medium',
                            statusColors[status]
                          )}
                          title={`${property.name} — ${format(day, 'd MMM', { locale: fr })} — ${statusLabels[status]}`}
                        >
                          {status === 'reserved' && '●'}
                          {status === 'cleaning' && '◆'}
                          {status === 'free' && '○'}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
