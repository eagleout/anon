'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Plus, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NotificationsDropdown } from '@/components/layout/NotificationsDropdown'
import { useUIStore } from '@/stores/uiStore'
import { useProperties } from '@/lib/hooks/useProperties'

const breadcrumbMap: Record<string, string> = {
  '/': 'Dashboard',
  '/properties': 'Propriétés',
  '/reservations': 'Réservations',
  '/guests': 'Messagerie',
  '/cleaning': 'Ménage & Inspections',
  '/owners': 'Propriétaires',
  '/reports': 'Rapports',
  '/settings': 'Paramètres',
  '/settings/team': 'Équipe',
  '/settings/integrations': 'Intégrations',
  '/settings/billing': 'Facturation',
}

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const crumbs: { label: string; href: string }[] = [
    { label: 'Dashboard', href: '/' },
  ]

  let currentPath = ''
  for (const segment of segments) {
    currentPath += `/${segment}`
    const label = breadcrumbMap[currentPath]
    if (label && currentPath !== '/') {
      crumbs.push({ label, href: currentPath })
    }
  }

  return crumbs
}

export function Header() {
  const pathname = usePathname()
  const { setSidebarOpen, selectedPropertyId, setSelectedPropertyId } =
    useUIStore()
  const { properties } = useProperties()
  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="rounded-md p-2 text-muted-foreground hover:bg-muted lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumb */}
      <nav className="hidden items-center gap-1.5 text-sm lg:flex">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center gap-1.5">
            {index > 0 && (
              <span className="text-muted-foreground">/</span>
            )}
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-foreground">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Mobile title */}
      <span className="text-sm font-medium lg:hidden">
        {breadcrumbs[breadcrumbs.length - 1]?.label}
      </span>

      <div className="flex-1" />

      {/* Property filter */}
      <Select
        value={selectedPropertyId ?? 'all'}
        onValueChange={(val) =>
          setSelectedPropertyId(val === 'all' ? null : val)
        }
      >
        <SelectTrigger className="hidden w-48 md:flex">
          <SelectValue placeholder="Toutes les propriétés" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les propriétés</SelectItem>
          {properties.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Notifications */}
      <NotificationsDropdown />

      {/* CTA */}
      <Button
        size="sm"
        className="hidden gap-1.5 sm:flex"
        render={<Link href="/reservations?new=true" />}
      >
        <Plus className="h-4 w-4" />
        Nouvelle réservation
      </Button>
    </header>
  )
}
