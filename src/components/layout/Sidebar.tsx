'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Home,
  CalendarDays,
  MessageSquare,
  Sparkles,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { ComponentProps } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useUnreadCount } from '@/lib/hooks/useMessages'
import { getInitials } from '@/lib/utils/formatting'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Propriétés', href: '/properties', icon: Home },
  { name: 'Réservations', href: '/reservations', icon: CalendarDays },
  { name: 'Messagerie', href: '/guests', icon: MessageSquare, badge: true },
  { name: 'Ménage & Inspections', href: '/cleaning', icon: Sparkles },
  { name: 'Propriétaires', href: '/owners', icon: Users },
  { name: 'Rapports', href: '/reports', icon: BarChart3 },
  { name: 'Paramètres', href: '/settings', icon: Settings },
]

const planLabels: Record<string, { label: string; color: string }> = {
  free: { label: 'FREE', color: 'bg-slate-500' },
  pro: { label: 'PRO', color: 'bg-amber-500' },
  enterprise: { label: 'ENTERPRISE', color: 'bg-emerald-500' },
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, organization } = useAuthStore()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const unreadCount = useUnreadCount()

  const plan = planLabels[organization?.plan ?? 'free']

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out',
        sidebarOpen ? 'w-64' : 'w-16'
      )}
    >
      {/* Logo & Org Name */}
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary font-bold text-sidebar-primary-foreground text-sm">
          A
        </div>
        {sidebarOpen && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-semibold">ARIA</span>
            <span className="truncate text-xs text-sidebar-foreground/60">
              {organization?.name ?? 'Conciergerie'}
            </span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            'hidden rounded-md p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground lg:block transition-transform',
            !sidebarOpen && 'rotate-180'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {navigation.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)

          const link = (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 shrink-0',
                  isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/50'
                )}
              />
              {sidebarOpen && (
                <>
                  <span className="flex-1">{item.name}</span>
                  {item.badge && unreadCount > 0 && (
                    <Badge
                      variant="default"
                      className="h-5 min-w-5 bg-sidebar-primary px-1.5 text-xs text-sidebar-primary-foreground"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </>
              )}
              {!sidebarOpen && item.badge && unreadCount > 0 && (
                <span className="absolute right-2 top-1 h-2 w-2 rounded-full bg-sidebar-primary" />
              )}
            </Link>
          )

          if (!sidebarOpen) {
            return (
              <Tooltip key={item.name}>
                <TooltipTrigger render={<div />}>{link}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.name}
                </TooltipContent>
              </Tooltip>
            )
          }

          return link
        })}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Plan indicator */}
      {sidebarOpen && (
        <div className="px-4 py-2">
          <Badge className={cn('text-xs text-white', plan.color)}>
            {plan.label}
          </Badge>
        </div>
      )}

      {/* User section */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={user?.avatar_url ?? undefined} />
          <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-xs">
            {user ? getInitials(user.full_name) : 'AR'}
          </AvatarFallback>
        </Avatar>
        {sidebarOpen && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium">
              {user?.full_name ?? 'Utilisateur'}
            </span>
            <span className="truncate text-xs text-sidebar-foreground/60">
              {user?.role ?? 'OWNER'}
            </span>
          </div>
        )}
        {sidebarOpen && (
          <button className="rounded-md p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground">
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  )
}
