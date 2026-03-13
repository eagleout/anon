'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles, Clock, CheckCircle2, AlertCircle, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { CleaningMission, User as UserType } from '@/lib/supabase/types'
import { formatTime } from '@/lib/utils/dates'

const statusConfig: Record<
  string,
  { label: string; color: string; icon: typeof Clock }
> = {
  PENDING: { label: 'En attente', color: 'text-slate-500', icon: Clock },
  ASSIGNED: { label: 'Assignée', color: 'text-blue-500', icon: User },
  IN_PROGRESS: { label: 'En cours', color: 'text-orange-500', icon: Sparkles },
  COMPLETED: { label: 'Terminée', color: 'text-emerald-500', icon: CheckCircle2 },
  ISSUE: { label: 'Problème', color: 'text-red-500', icon: AlertCircle },
}

interface MissionWithAgent extends CleaningMission {
  agent?: UserType | null
  propertyName?: string
}

export function TodayMissions() {
  const [missions, setMissions] = useState<MissionWithAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      const today = new Date().toISOString().split('T')[0]

      const { data: rawMissions } = await supabase
        .from('cleaning_missions')
        .select('*')
        .eq('scheduled_date', today)
        .order('scheduled_start', { ascending: true })

      if (!rawMissions || rawMissions.length === 0) {
        setMissions([])
        setIsLoading(false)
        return
      }

      // Enrichir avec noms des agents et propriétés
      const propertyIds = [...new Set(rawMissions.map((m) => m.property_id))]
      const agentIds = [...new Set(rawMissions.map((m) => m.assigned_to).filter(Boolean))] as string[]

      const [propRes, agentRes] = await Promise.all([
        supabase.from('properties').select('id, name').in('id', propertyIds),
        agentIds.length > 0
          ? supabase.from('users').select('*').in('id', agentIds)
          : Promise.resolve({ data: [] as UserType[] }),
      ])

      const propMap = new Map(propRes.data?.map((p) => [p.id, p.name]) ?? [])
      const agentMap = new Map(agentRes.data?.map((a) => [a.id, a]) ?? [])

      const enriched: MissionWithAgent[] = rawMissions.map((m) => ({
        ...m,
        propertyName: propMap.get(m.property_id) ?? 'Propriété',
        agent: m.assigned_to ? agentMap.get(m.assigned_to) ?? null : null,
      }))

      setMissions(enriched)
      setIsLoading(false)
    }

    fetch()

    // Realtime sur les missions
    const channel = supabase
      .channel('today-missions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cleaning_missions' },
        () => fetch()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
        <h2 className="text-lg font-semibold">Missions du jour</h2>
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Missions du jour</h2>
        <Link
          href="/cleaning"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Voir tout
        </Link>
      </div>

      {missions.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Sparkles className="mb-2 h-8 w-8" />
          <p className="text-sm">Aucune mission planifi&eacute;e</p>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {missions.map((mission) => {
            const config = statusConfig[mission.status] ?? statusConfig.PENDING
            const Icon = config.icon
            return (
              <Link
                key={mission.id}
                href={`/cleaning/missions/${mission.id}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className={cn('h-4 w-4', config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {mission.propertyName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {mission.agent?.full_name ?? 'Non assignée'}
                    {mission.scheduled_start &&
                      ` · ${formatTime(mission.scheduled_start)}`}
                  </p>
                </div>
                <Badge variant="outline" className={cn('text-xs', config.color)}>
                  {config.label}
                </Badge>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
