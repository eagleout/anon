'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/lib/supabase/types'

export function useMessages(reservationId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchMessages = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('messages')
      .select('*')
      .eq('reservation_id', reservationId)
      .order('sent_at', { ascending: true })

    if (err) {
      setError(err.message)
    } else {
      setMessages(data ?? [])
    }
    setIsLoading(false)
  }, [supabase, reservationId])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // Abonnement temps réel aux nouveaux messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${reservationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `reservation_id=eq.${reservationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, reservationId])

  return { messages, isLoading, error, refetch: fetchMessages }
}

export function useUnreadCount() {
  const [count, setCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      const { count: unread } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('direction', 'INBOUND')
        .is('read_at', null)

      setCount(unread ?? 0)
    }
    fetch()
  }, [supabase])

  return count
}
