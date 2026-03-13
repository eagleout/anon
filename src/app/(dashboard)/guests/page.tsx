'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, MessageSquare, Mail, Clock, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { formatRelative } from '@/lib/utils/dates'
import { getInitials } from '@/lib/utils/formatting'
import type { Reservation, Message } from '@/lib/supabase/types'

interface Conversation {
  reservation: Reservation
  lastMessage: Message | null
  unreadCount: number
  propertyName: string
}

export default function GuestsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      // Récupérer toutes les réservations actives avec messages
      const { data: reservations } = await supabase
        .from('reservations')
        .select('*')
        .neq('status', 'CANCELLED')
        .order('updated_at', { ascending: false })

      if (!reservations) {
        setIsLoading(false)
        return
      }

      const convs: Conversation[] = []

      // Récupérer les propriétés
      const propIds = [...new Set((reservations as Reservation[]).map((r) => r.property_id))]
      const { data: properties } = await supabase
        .from('properties')
        .select('id, name')
        .in('id', propIds)
      const propMap = new Map((properties ?? []).map((p: { id: string; name: string }) => [p.id, p.name]))

      for (const resa of reservations as Reservation[]) {
        // Dernier message
        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .eq('reservation_id', resa.id)
          .order('sent_at', { ascending: false })
          .limit(1)

        // Nombre de non lus
        const { count: unread } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('reservation_id', resa.id)
          .eq('direction', 'INBOUND')
          .is('read_at', null)

        const lastMsg = msgs && msgs.length > 0 ? (msgs[0] as Message) : null

        convs.push({
          reservation: resa,
          lastMessage: lastMsg,
          unreadCount: unread ?? 0,
          propertyName: propMap.get(resa.property_id) ?? 'Propriété',
        })
      }

      // Trier par dernière activité
      convs.sort((a, b) => {
        const aTime = a.lastMessage?.sent_at ?? a.reservation.updated_at
        const bTime = b.lastMessage?.sent_at ?? b.reservation.updated_at
        return new Date(bTime).getTime() - new Date(aTime).getTime()
      })

      setConversations(convs)
      setIsLoading(false)
    }

    fetch()

    // Realtime
    const channel = supabase
      .channel('inbox-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => fetch()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const filtered = useMemo(() => {
    if (!search) return conversations
    const q = search.toLowerCase()
    return conversations.filter(
      (c) =>
        c.reservation.guest_name.toLowerCase().includes(q) ||
        c.propertyName.toLowerCase().includes(q) ||
        (c.reservation.guest_email ?? '').toLowerCase().includes(q)
    )
  }, [conversations, search])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Messagerie</h1>
          <p className="text-sm text-muted-foreground">
            {conversations.length} conversation{conversations.length > 1 ? 's' : ''} active{conversations.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" render={<Link href="/guests/templates" />}>
          <FileText className="h-3.5 w-3.5" />
          Templates
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un voyageur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Conversation list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
                <div className="h-3 w-48 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-muted-foreground">
          <MessageSquare className="mb-3 h-10 w-10" />
          <p className="text-sm font-medium">Aucune conversation</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((conv) => (
            <Link
              key={conv.reservation.id}
              href={`/guests/${conv.reservation.id}`}
              className={cn(
                'flex items-center gap-3 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md',
                conv.unreadCount > 0 ? 'border-accent/30 bg-accent/5' : 'border-border'
              )}
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                {getInitials(conv.reservation.guest_name)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold truncate">
                    {conv.reservation.guest_name}
                  </span>
                  {conv.unreadCount > 0 && (
                    <Badge className="h-5 min-w-5 bg-accent px-1.5 text-xs text-accent-foreground">
                      {conv.unreadCount}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {conv.propertyName}
                </p>
                {conv.lastMessage && (
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">
                    {conv.lastMessage.direction === 'OUTBOUND' && 'Vous : '}
                    {conv.lastMessage.content.slice(0, 80)}
                  </p>
                )}
              </div>

              {/* Time */}
              <div className="shrink-0 text-right">
                {conv.lastMessage && (
                  <p className="text-[11px] text-muted-foreground">
                    {formatRelative(conv.lastMessage.sent_at)}
                  </p>
                )}
                <Badge variant="outline" className="mt-1 text-[10px]">
                  {conv.reservation.platform}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
