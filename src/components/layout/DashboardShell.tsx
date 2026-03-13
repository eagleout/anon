'use client'

import { TooltipProvider } from '@/components/ui/tooltip'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

export function DashboardShell({
  children,
}: {
  children: React.ReactNode
}) {
  const { sidebarOpen } = useUIStore()

  return (
    <TooltipProvider delay={0}>
      <div className="min-h-screen bg-background">
        {/* Sidebar (desktop) */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Main content */}
        <div
          className={cn(
            'flex flex-col transition-all duration-300 ease-in-out',
            sidebarOpen ? 'lg:pl-64' : 'lg:pl-16'
          )}
        >
          <Header />

          <main className="flex-1 px-4 py-6 pb-20 lg:px-6 lg:pb-6">
            {children}
          </main>
        </div>

        {/* Mobile bottom nav */}
        <MobileNav />
      </div>
    </TooltipProvider>
  )
}
