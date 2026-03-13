'use client'

import { useEffect, useState } from 'react'
import { Euro } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/formatting'

export function RevenueWidget() {
  const [revenue, setRevenue] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchRevenue() {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0]
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0]

      const { data } = await supabase
        .from('reservations')
        .select('amount_gross')
        .neq('status', 'CANCELLED')
        .gte('checkin_date', startOfMonth)
        .lte('checkin_date', endOfMonth)

      if (data) {
        const total = data.reduce((sum, r) => sum + (r.amount_gross || 0), 0)
        setRevenue(total)
      } else {
        setRevenue(0)
      }
      setIsLoading(false)
    }

    fetchRevenue()
  }, [supabase])

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Revenus du mois</p>
          {isLoading ? (
            <div className="mt-1 h-8 w-20 animate-pulse rounded bg-muted" />
          ) : (
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {revenue !== null ? formatCurrency(revenue) : '—'}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">Mois en cours</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
          <Euro className="h-5 w-5 text-accent" />
        </div>
      </div>
    </div>
  )
}
