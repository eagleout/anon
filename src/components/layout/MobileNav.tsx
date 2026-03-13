'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Home,
  CalendarDays,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useUnreadCount } from '@/lib/hooks/useMessages'

const tabs = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Propriétés', href: '/properties', icon: Home },
  { name: 'Réservations', href: '/reservations', icon: CalendarDays },
  { name: 'Messages', href: '/guests', icon: MessageSquare, badge: true },
  { name: 'Ménage', href: '/cleaning', icon: Sparkles },
]

export function MobileNav() {
  const pathname = usePathname()
  const unreadCount = useUnreadCount()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
      <div className="flex h-16 items-center justify-around">
        {tabs.map((tab) => {
          const isActive =
            tab.href === '/'
              ? pathname === '/'
              : pathname.startsWith(tab.href)

          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                'relative flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors',
                isActive
                  ? 'text-accent'
                  : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <tab.icon className="h-5 w-5" />
                {tab.badge && unreadCount > 0 && (
                  <Badge className="absolute -right-2.5 -top-1.5 h-4 min-w-4 bg-destructive px-1 text-[10px] text-white">
                    {unreadCount}
                  </Badge>
                )}
              </div>
              <span className="font-medium">{tab.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
