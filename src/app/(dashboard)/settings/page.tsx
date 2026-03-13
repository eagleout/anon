'use client'

import { useEffect, useState } from 'react'
import {
  Settings,
  Building2,
  User,
  Bell,
  Palette,
  Shield,
  Save,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

interface SettingsSection {
  id: string
  label: string
  icon: typeof Settings
}

const sections: SettingsSection[] = [
  { id: 'organization', label: 'Organisation', icon: Building2 },
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Apparence', icon: Palette },
]

export default function SettingsPage() {
  const { user, organization } = useAuthStore()
  const [activeSection, setActiveSection] = useState('organization')
  const [orgName, setOrgName] = useState(organization?.name ?? '')
  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (organization) setOrgName(organization.name)
    if (user) {
      setFullName(user.full_name)
      setEmail(user.email)
    }
  }, [organization, user])

  function handleSave() {
    setSaving(true)
    // Simule la sauvegarde (pas de backend pour l'instant)
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 500)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground">
          Configurez votre espace de travail
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar navigation */}
        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                activeSection === section.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <section.icon className="h-4 w-4" />
              {section.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeSection === 'organization' && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Organisation</h2>
                <p className="text-sm text-muted-foreground">Informations de votre conciergerie</p>
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nom de l'organisation</Label>
                  <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Plan actuel</Label>
                  <div className="flex items-center gap-2">
                    <Badge className={cn(
                      'text-xs text-white',
                      organization?.plan === 'pro' ? 'bg-amber-500' :
                      organization?.plan === 'enterprise' ? 'bg-emerald-500' : 'bg-slate-500'
                    )}>
                      {(organization?.plan ?? 'free').toUpperCase()}
                    </Badge>
                    {organization?.plan === 'free' && (
                      <span className="text-xs text-muted-foreground">
                        Passez en Pro pour débloquer toutes les fonctionnalités
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Slug</Label>
                  <Input value={organization?.slug ?? ''} disabled className="bg-muted" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {saved ? 'Enregistré !' : 'Enregistrer'}
                </Button>
              </div>
            </div>
          )}

          {activeSection === 'profile' && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Profil</h2>
                <p className="text-sm text-muted-foreground">Vos informations personnelles</p>
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nom complet</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
                </div>
                <div className="space-y-1.5">
                  <Label>Rôle</Label>
                  <Input value={user?.role ?? 'OWNER'} disabled className="bg-muted" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="gap-1.5">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {saved ? 'Enregistré !' : 'Enregistrer'}
                </Button>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Notifications</h2>
                <p className="text-sm text-muted-foreground">Configurez vos préférences de notification</p>
              </div>
              <Separator />
              <div className="space-y-4">
                {[
                  { id: 'new-reservation', label: 'Nouvelle réservation', desc: 'Recevoir une notification pour chaque nouvelle réservation' },
                  { id: 'message', label: 'Nouveau message', desc: 'Recevoir une notification pour chaque message de voyageur' },
                  { id: 'checkin', label: 'Check-in du jour', desc: 'Rappel des arrivées du jour chaque matin' },
                  { id: 'cleaning', label: 'Mission de ménage', desc: 'Notification quand une mission est terminée ou a un problème' },
                  { id: 'owner-report', label: 'Rapports propriétaires', desc: 'Notification quand un rapport est prêt à envoyer' },
                ].map((notif) => (
                  <div key={notif.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="text-sm font-medium">{notif.label}</p>
                      <p className="text-xs text-muted-foreground">{notif.desc}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Apparence</h2>
                <p className="text-sm text-muted-foreground">Personnalisez l'interface</p>
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Thème</Label>
                  <div className="flex gap-3">
                    {[
                      { value: 'light', label: 'Clair', active: true },
                      { value: 'dark', label: 'Sombre', active: false },
                      { value: 'system', label: 'Système', active: false },
                    ].map((theme) => (
                      <button
                        key={theme.value}
                        className={cn(
                          'rounded-lg border-2 px-6 py-3 text-sm font-medium transition-colors',
                          theme.active
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border hover:border-muted-foreground'
                        )}
                      >
                        {theme.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <Label>Couleurs</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#1E293B] border-2 border-border" />
                      <span className="text-xs text-muted-foreground">Primary</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#D4A853] border-2 border-border" />
                      <span className="text-xs text-muted-foreground">Accent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#F8F7F4] border-2 border-border" />
                      <span className="text-xs text-muted-foreground">Background</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
