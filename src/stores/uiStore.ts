import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  selectedPropertyId: string | null
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSelectedPropertyId: (id: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  selectedPropertyId: null,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSelectedPropertyId: (id) => set({ selectedPropertyId: id }),
}))
