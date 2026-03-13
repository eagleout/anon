'use client'

import { useState } from 'react'
import {
  Bell,
  MessageSquare,
  AlertTriangle,
  ClipboardCheck,
  CalendarX2,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { formatRelative } from '@/lib/utils/dates'

type AlertType =
  | 'message_non_repondu'
  | 'mission_en_retard'
  | 'inspection_requise'
  | 'double_reservation'
  | 'revue_a_repondre'

interface Notification {
  id: string
  type: AlertType
  title: string
  property: string
  createdAt: string
  read: boolean
  href: string
}

const alertConfig: Record<
  AlertType,
  { icon: typeof Bell; color: string; bgColor: string }
> = {
  message_non_repondu: {
    icon: MessageSquare,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  mission_en_retard: {
    icon: AlertTriangle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  inspection_requise: {
    icon: ClipboardCheck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  double_reservation: {
    icon: CalendarX2,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  revue_a_repondre: {
    icon: Star,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
}

export function NotificationsDropdown() {
  // TODO: Remplacer par des données temps réel Supabase
  const [notifications] = useState<Notification[]>([])
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -right-1 -top-1 h-5 min-w-5 bg-destructive px-1 text-xs text-white">
            {unreadCount}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <button className="text-xs text-muted-foreground hover:text-foreground">
              Tout marquer comme lu
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Aucune notification
            </div>
          ) : (
            notifications.map((notification) => {
              const config = alertConfig[notification.type]
              const Icon = config.icon
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 cursor-pointer',
                    !notification.read && 'bg-muted/50'
                  )}
                >
                  <div
                    className={cn(
                      'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      config.bgColor
                    )}
                  >
                    <Icon className={cn('h-4 w-4', config.color)} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {notification.property}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelative(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-sidebar-primary" />
                  )}
                </DropdownMenuItem>
              )
            })
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
