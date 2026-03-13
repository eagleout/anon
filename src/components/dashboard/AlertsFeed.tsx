'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  MessageSquare,
  AlertTriangle,
  ClipboardCheck,
  CalendarX2,
  Star,
  Inbox,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { formatRelative } from '@/lib/utils/dates'

type AlertType =
  | 'message_non_repondu'
  | 'mission_en_retard'
  | 'inspection_requise'
  | 'double_reservation'

interface Alert {
  id: string
  type: AlertType
  title: string
  propertyName: string
  href: string
  createdAt: string
}

const alertConfig: Record<
  AlertType,
  { icon: typeof MessageSquare; color: string; bgColor: string; label: string }
> = {
  message_non_repondu: {
    icon: MessageSquare,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    label: 'Message',
  },
  mission_en_retard: {
    icon: AlertTriangle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    label: 'Retard',
  },
  inspection_requise: {
    icon: ClipboardCheck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    label: 'Inspection',
  },
  double_reservation: {
    icon: CalendarX2,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    label: 'Conflit',
  },
}

export function AlertsFeed() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchAlerts() {
      const generatedAlerts: Alert[] = []

      // Messages non lus (inbound sans read_at)
      const { data: unreadMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('direction', 'INBOUND')
        .is('read_at', null)
        .order('sent_at', { ascending: false })
        .limit(5)

      if (unreadMessages) {
        for (const msg of unreadMessages as Array<{ id: string; reservation_id: string; sent_at: string }>) {
          generatedAlerts.push({
            id: `msg-${msg.id}`,
            type: 'message_non_repondu',
            title: 'Message voyageur non lu',
            propertyName: '',
            href: `/guests/${msg.reservation_id}`,
            createdAt: msg.sent_at,
          })
        }
      }

      // Missions en retard (scheduled_date < today, status != COMPLETED)
      const today = new Date().toISOString().split('T')[0]
      const { data: lateMissions } = await supabase
        .from('cleaning_missions')
        .select('*')
        .lt('scheduled_date', today)
        .not('status', 'in', '("COMPLETED")')
        .order('scheduled_date', { ascending: false })
        .limit(5)

      if (lateMissions) {
        for (const mission of lateMissions as Array<{ id: string; property_id: string; scheduled_date: string }>) {
          generatedAlerts.push({
            id: `mission-${mission.id}`,
            type: 'mission_en_retard',
            title: 'Mission ménage en retard',
            propertyName: '',
            href: `/cleaning/missions/${mission.id}`,
            createdAt: mission.scheduled_date,
          })
        }
      }

      // Inspections requises (missions COMPLETED sans inspection)
      const { data: completedMissions } = await supabase
        .from('cleaning_missions')
        .select('*')
        .eq('status', 'COMPLETED')
        .limit(10)

      if (completedMissions) {
        for (const mission of completedMissions as Array<{ id: string; property_id: string }>) {
          const { count } = await supabase
            .from('property_inspections')
            .select('*', { count: 'exact', head: true })
            .eq('cleaning_mission_id', mission.id)

          if (count === 0) {
            generatedAlerts.push({
              id: `insp-${mission.id}`,
              type: 'inspection_requise',
              title: "État des lieux requis",
              propertyName: '',
              href: `/cleaning/inspections/${mission.id}`,
              createdAt: new Date().toISOString(),
            })
          }
        }
      }

      setAlerts(generatedAlerts.slice(0, 10))
      setIsLoading(false)
    }

    fetchAlerts()

    // Realtime: écouter les nouvelles entrées
    const channel = supabase
      .channel('dashboard-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => fetchAlerts()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'cleaning_missions' },
        () => fetchAlerts()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Alertes & Actions urgentes</h2>
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-40 animate-pulse rounded bg-muted" />
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Alertes & Actions urgentes</h2>
      {alerts.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Inbox className="mb-2 h-8 w-8" />
          <p className="text-sm">Aucune alerte pour le moment</p>
          <p className="text-xs">Tout est sous contr&ocirc;le</p>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {alerts.map((alert) => {
            const config = alertConfig[alert.type]
            const Icon = config.icon
            return (
              <Link
                key={alert.id}
                href={alert.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
              >
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                    config.bgColor
                  )}
                >
                  <Icon className={cn('h-4 w-4', config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{alert.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelative(alert.createdAt)}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn('shrink-0 text-xs', config.color)}
                >
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
