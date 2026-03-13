'use client'

import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatPercent } from '@/lib/utils/formatting'

export function OccupancyWidget() {
  const [rate, setRate] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchOccupancy() {
      const now = new Date()
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay() + 1)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)

      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('status', 'ACTIVE')

      if (!properties || properties.length === 0) {
        setRate(null)
        setIsLoading(false)
        return
      }

      const startStr = startOfWeek.toISOString().split('T')[0]
      const endStr = endOfWeek.toISOString().split('T')[0]

      let totalOccupied = 0
      const totalDays = properties.length * 7

      for (const prop of properties) {
        const { data: reservations } = await supabase
          .from('reservations')
          .select('checkin_date, checkout_date')
          .eq('property_id', prop.id)
          .neq('status', 'CANCELLED')
          .lte('checkin_date', endStr)
          .gte('checkout_date', startStr)

        if (reservations) {
          for (const r of reservations) {
            const rStart = new Date(Math.max(new Date(r.checkin_date).getTime(), startOfWeek.getTime()))
            const rEnd = new Date(Math.min(new Date(r.checkout_date).getTime(), endOfWeek.getTime()))
            const days = Math.max(0, Math.ceil((rEnd.getTime() - rStart.getTime()) / (1000 * 60 * 60 * 24)))
            totalOccupied += days
          }
        }
      }

      setRate(totalDays > 0 ? (totalOccupied / totalDays) * 100 : 0)
      setIsLoading(false)
    }

    fetchOccupancy()
  }, [supabase])

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Taux d&apos;occupation</p>
          {isLoading ? (
            <div className="mt-1 h-8 w-16 animate-pulse rounded bg-muted" />
          ) : (
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {rate !== null ? formatPercent(rate) : '—'}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">Semaine en cours</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
          <TrendingUp className="h-5 w-5 text-accent" />
        </div>
      </div>
    </div>
  )
}
