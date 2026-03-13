'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Reservation } from '@/lib/supabase/types'

interface UseReservationsOptions {
  propertyId?: string
  status?: string
  platform?: string
}

export function useReservations(options?: UseReservationsOptions) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchReservations = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    let query = supabase
      .from('reservations')
      .select('*')
      .order('checkin_date', { ascending: true })

    if (options?.propertyId) {
      query = query.eq('property_id', options.propertyId)
    }
    if (options?.status) {
      query = query.eq('status', options.status)
    }
    if (options?.platform) {
      query = query.eq('platform', options.platform)
    }

    const { data, error: err } = await query

    if (err) {
      setError(err.message)
    } else {
      setReservations(data ?? [])
    }
    setIsLoading(false)
  }, [supabase, options?.propertyId, options?.status, options?.platform])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  return { reservations, isLoading, error, refetch: fetchReservations }
}

export function useReservation(id: string) {
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      setIsLoading(true)
      const { data, error: err } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', id)
        .single()

      if (err) {
        setError(err.message)
      } else {
        setReservation(data)
      }
      setIsLoading(false)
    }
    fetch()
  }, [id, supabase])

  return { reservation, isLoading, error }
}
