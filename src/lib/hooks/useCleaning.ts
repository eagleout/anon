'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { CleaningMission } from '@/lib/supabase/types'

interface UseCleaningOptions {
  propertyId?: string
  assignedTo?: string
  status?: string
  date?: string
}

export function useCleaningMissions(options?: UseCleaningOptions) {
  const [missions, setMissions] = useState<CleaningMission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchMissions = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    let query = supabase
      .from('cleaning_missions')
      .select('*')
      .order('scheduled_date', { ascending: true })

    if (options?.propertyId) {
      query = query.eq('property_id', options.propertyId)
    }
    if (options?.assignedTo) {
      query = query.eq('assigned_to', options.assignedTo)
    }
    if (options?.status) {
      query = query.eq('status', options.status)
    }
    if (options?.date) {
      query = query.eq('scheduled_date', options.date)
    }

    const { data, error: err } = await query

    if (err) {
      setError(err.message)
    } else {
      setMissions(data ?? [])
    }
    setIsLoading(false)
  }, [supabase, options?.propertyId, options?.assignedTo, options?.status, options?.date])

  useEffect(() => {
    fetchMissions()
  }, [fetchMissions])

  return { missions, isLoading, error, refetch: fetchMissions }
}
