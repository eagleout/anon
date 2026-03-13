'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Property } from '@/lib/supabase/types'

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchProperties = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('properties')
      .select('*')
      .order('name')

    if (err) {
      setError(err.message)
    } else {
      setProperties(data ?? [])
    }
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  return { properties, isLoading, error, refetch: fetchProperties }
}

export function useProperty(id: string) {
  const [property, setProperty] = useState<Property | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetch() {
      setIsLoading(true)
      const { data, error: err } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single()

      if (err) {
        setError(err.message)
      } else {
        setProperty(data)
      }
      setIsLoading(false)
    }
    fetch()
  }, [id, supabase])

  return { property, isLoading, error }
}
