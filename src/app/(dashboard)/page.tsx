'use client'

import { UpcomingArrivals } from '@/components/dashboard/UpcomingArrivals'
import { OccupancyWidget } from '@/components/dashboard/OccupancyWidget'
import { RevenueWidget } from '@/components/dashboard/RevenueWidget'
import { AlertsFeed } from '@/components/dashboard/AlertsFeed'
import { WeekCalendar } from '@/components/dashboard/WeekCalendar'
import { TodayMissions } from '@/components/dashboard/TodayMissions'
import { TopProperties } from '@/components/dashboard/TopProperties'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Vue d&apos;ensemble de votre activit&eacute;
        </p>
      </div>

      {/* ROW 1 — KPIs du jour */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UpcomingArrivals />
        <OccupancyWidget />
        <RevenueWidget />
      </div>

      {/* ROW 2 — Alertes & Actions urgentes */}
      <AlertsFeed />

      {/* ROW 3 — Calendrier + Missions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <WeekCalendar />
        <TodayMissions />
      </div>

      {/* ROW 4 — Top propriétés */}
      <TopProperties />
    </div>
  )
}
