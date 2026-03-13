'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatPercent } from '@/lib/utils/formatting'
import type { Property } from '@/lib/supabase/types'

interface PropertyMetrics {
  property: Property
  occupancyRate: number
  revenue: number
  avgScore: number | null
}

export function TopProperties() {
  const [metrics, setMetrics] = useState<PropertyMetrics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      const { data: properties } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('name')
        .limit(10)

      if (!properties || properties.length === 0) {
        setIsLoading(false)
        return
      }

      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0]
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0]
      const daysInMonth =
        new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

      const results: PropertyMetrics[] = []

      for (const property of properties) {
        // Revenus et occupation
        const { data: reservations } = await supabase
          .from('reservations')
          .select('amount_gross, checkin_date, checkout_date')
          .eq('property_id', property.id)
          .neq('status', 'CANCELLED')
          .lte('checkin_date', endOfMonth)
          .gte('checkout_date', startOfMonth)

        let revenue = 0
        let occupiedDays = 0

        if (reservations) {
          for (const r of reservations) {
            revenue += r.amount_gross || 0
            const rStart = new Date(
              Math.max(
                new Date(r.checkin_date).getTime(),
                new Date(startOfMonth).getTime()
              )
            )
            const rEnd = new Date(
              Math.min(
                new Date(r.checkout_date).getTime(),
                new Date(endOfMonth).getTime()
              )
            )
            occupiedDays += Math.max(
              0,
              Math.ceil(
                (rEnd.getTime() - rStart.getTime()) / (1000 * 60 * 60 * 24)
              )
            )
          }
        }

        // Note moyenne des inspections
        const { data: inspections } = await supabase
          .from('property_inspections')
          .select('cleanliness_score')
          .eq('property_id', property.id)
          .not('cleanliness_score', 'is', null)
          .order('created_at', { ascending: false })
          .limit(5)

        let avgScore: number | null = null
        if (inspections && inspections.length > 0) {
          avgScore =
            inspections.reduce(
              (sum, i) => sum + (i.cleanliness_score ?? 0),
              0
            ) / inspections.length
        }

        results.push({
          property,
          occupancyRate: (occupiedDays / daysInMonth) * 100,
          revenue,
          avgScore,
        })
      }

      // Trier par revenu décroissant
      results.sort((a, b) => b.revenue - a.revenue)
      setMetrics(results)
      setIsLoading(false)
    }

    fetch()
  }, [supabase])

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Top propri&eacute;t&eacute;s</h2>
        <div className="mt-4 space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Top propri&eacute;t&eacute;s</h2>
      {metrics.length === 0 ? (
        <p className="mt-4 text-center text-sm text-muted-foreground py-4">
          Aucune propri&eacute;t&eacute; active
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="pb-2 text-left font-medium">Propri&eacute;t&eacute;</th>
                <th className="pb-2 text-right font-medium">Occupation</th>
                <th className="pb-2 text-right font-medium">Revenus</th>
                <th className="hidden pb-2 text-right font-medium sm:table-cell">
                  Note
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.map(({ property, occupancyRate, revenue, avgScore }) => (
                <tr
                  key={property.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="py-2.5">
                    <Link
                      href={`/properties/${property.id}`}
                      className="font-medium hover:text-accent transition-colors"
                    >
                      {property.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {property.city}
                    </p>
                  </td>
                  <td className="py-2.5 text-right">
                    {formatPercent(occupancyRate)}
                  </td>
                  <td className="py-2.5 text-right font-medium">
                    {formatCurrency(revenue)}
                  </td>
                  <td className="hidden py-2.5 text-right sm:table-cell">
                    {avgScore !== null ? `${avgScore.toFixed(1)}/5` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
