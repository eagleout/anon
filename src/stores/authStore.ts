import { create } from 'zustand'
import type { User, Organization } from '@/lib/supabase/types'

interface AuthState {
  user: User | null
  organization: Organization | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setOrganization: (organization: Organization | null) => void
  setLoading: (isLoading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  organization: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setOrganization: (organization) => set({ organization }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ user: null, organization: null, isLoading: false }),
}))
