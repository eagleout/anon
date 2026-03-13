'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  BarChart3,
  TrendingUp,
  Euro,
  Home,
  CalendarDays,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatPercent } from '@/lib/utils/formatting'
import { formatDate } from '@/lib/utils/dates'
import type { Reservation, Property } from '@/lib/supabase/types'

export default function ReportsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [propertyFilter, setPropertyFilter] = useState('all')
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const [resaRes, propRes] = await Promise.all([
      supabase.from('reservations').select('*').neq('status', 'CANCELLED'),
      supabase.from('properties').select('*').order('name'),
    ])
    setReservations((resaRes.data as Reservation[]) ?? [])
    setProperties((propRes.data as Property[]) ?? [])
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filtered = useMemo(() => {
    if (propertyFilter === 'all') return reservations
    return reservations.filter((r) => r.property_id === propertyFilter)
  }, [reservations, propertyFilter])

  const stats = useMemo(() => {
    const totalGross = filtered.reduce((sum, r) => sum + r.amount_gross, 0)
    const totalNet = filtered.reduce((sum, r) => sum + r.amount_net, 0)
    const totalPlatformFees = filtered.reduce((sum, r) => sum + r.platform_fee, 0)
    const totalConciergeFees = filtered.reduce((sum, r) => sum + r.concierge_fee, 0)
    const totalReservations = filtered.length
    const checkedIn = filtered.filter((r) => r.status === 'CHECKED_IN').length
    const confirmed = filtered.filter((r) => r.status === 'CONFIRMED').length
    const completed = filtered.filter((r) => r.status === 'CHECKED_OUT').length
    const avgPerReservation = totalReservations > 0 ? totalGross / totalReservations : 0

    // Calcul taux d'occupation simple (nombre de jours occupés / 365)
    let totalNights = 0
    for (const r of filtered) {
      if (['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'].includes(r.status)) {
        const nights = Math.ceil(
          (new Date(r.checkout_date).getTime() - new Date(r.checkin_date).getTime()) / (1000 * 60 * 60 * 24)
        )
        totalNights += nights
      }
    }
    const targetProps = propertyFilter === 'all' ? properties.length : 1
    const occupancyRate = targetProps > 0 ? (totalNights / (365 * targetProps)) * 100 : 0

    // Revenus par propriété
    const revenueByProperty = new Map<string, { gross: number; net: number; count: number }>()
    for (const r of filtered) {
      const existing = revenueByProperty.get(r.property_id) ?? { gross: 0, net: 0, count: 0 }
      existing.gross += r.amount_gross
      existing.net += r.amount_net
      existing.count += 1
      revenueByProperty.set(r.property_id, existing)
    }

    // Revenus par mois (12 derniers mois)
    const revenueByMonth = new Map<string, number>()
    for (const r of filtered) {
      const month = r.checkin_date.slice(0, 7) // YYYY-MM
      revenueByMonth.set(month, (revenueByMonth.get(month) ?? 0) + r.amount_gross)
    }

    return {
      totalGross,
      totalNet,
      totalPlatformFees,
      totalConciergeFees,
      totalReservations,
      checkedIn,
      confirmed,
      completed,
      avgPerReservation,
      occupancyRate,
      revenueByProperty,
      revenueByMonth,
    }
  }, [filtered, properties])

  const propMap = useMemo(() => new Map(properties.map((p) => [p.id, p.name])), [properties])

  const sortedMonths = useMemo(() => {
    return [...stats.revenueByMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-12)
  }, [stats.revenueByMonth])

  const maxMonthRevenue = useMemo(() => {
    return Math.max(...sortedMonths.map(([, v]) => v), 1)
  }, [sortedMonths])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rapports</h1>
          <p className="text-sm text-muted-foreground">
            Vue d'ensemble de vos performances
          </p>
        </div>
        <Select value={propertyFilter} onValueChange={(v) => setPropertyFilter(v ?? 'all')}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Toutes les propriétés" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les propriétés</SelectItem>
            {properties.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Euro className="h-4 w-4" />
            <span className="text-xs font-medium">Revenu brut</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(stats.totalGross)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Net : {formatCurrency(stats.totalNet)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <CalendarDays className="h-4 w-4" />
            <span className="text-xs font-medium">Réservations</span>
          </div>
          <p className="text-2xl font-bold">{stats.totalReservations}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.checkedIn} en cours · {stats.confirmed} confirmées
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">Panier moyen</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(stats.avgPerReservation)}</p>
          <p className="text-xs text-muted-foreground mt-1">par réservation</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs font-medium">Taux d'occupation</span>
          </div>
          <p className="text-2xl font-bold">{formatPercent(stats.occupancyRate)}</p>
          <p className="text-xs text-muted-foreground mt-1">estimé sur l'année</p>
        </div>
      </div>

      {/* Commission breakdown */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Répartition des commissions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Commissions plateforme</p>
            <p className="text-xl font-bold text-destructive">{formatCurrency(stats.totalPlatformFees)}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Commissions conciergerie</p>
            <p className="text-xl font-bold text-accent">{formatCurrency(stats.totalConciergeFees)}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Net propriétaires</p>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(stats.totalNet)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue by month (simple bar chart) */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Revenus par mois</h2>
          {sortedMonths.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune donnée</p>
          ) : (
            <div className="space-y-2">
              {sortedMonths.map(([month, revenue]) => (
                <div key={month} className="flex items-center gap-3">
                  <span className="w-16 text-xs text-muted-foreground shrink-0">{month}</span>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${(revenue / maxMonthRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="w-24 text-xs text-right font-medium shrink-0">{formatCurrency(revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue by property */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Revenus par propriété</h2>
          {stats.revenueByProperty.size === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune donnée</p>
          ) : (
            <div className="space-y-3">
              {[...stats.revenueByProperty.entries()]
                .sort(([, a], [, b]) => b.gross - a.gross)
                .map(([propId, data]) => (
                  <div key={propId} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        <Home className="h-3.5 w-3.5 text-muted-foreground" />
                        {propMap.get(propId) ?? 'Propriété'}
                      </p>
                      <p className="text-xs text-muted-foreground">{data.count} réservation{data.count > 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(data.gross)}</p>
                      <p className="text-xs text-muted-foreground">Net : {formatCurrency(data.net)}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
