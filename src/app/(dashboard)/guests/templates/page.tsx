'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Mail,
  MessageSquare as SmsIcon,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { MessageTemplate, MessageTrigger, MessageChannel, Language } from '@/lib/supabase/types'

const triggerLabels: Record<string, { label: string; description: string }> = {
  BOOKING_CONFIRMED: { label: 'Confirmation', description: 'Envoyé à la confirmation de réservation' },
  J_MINUS_7: { label: 'J-7', description: '7 jours avant le check-in' },
  J_MINUS_3: { label: 'J-3', description: '3 jours avant le check-in' },
  J_MINUS_1: { label: 'J-1', description: 'La veille du check-in' },
  DAY_PLUS_1: { label: 'J+1', description: 'Le lendemain du check-in' },
  CHECKOUT_MINUS_1: { label: 'Départ J-1', description: 'La veille du check-out' },
  CHECKOUT_PLUS_1: { label: 'Post-séjour', description: 'Le lendemain du check-out' },
}

const channelConfig: Record<string, { icon: typeof Mail; color: string }> = {
  EMAIL: { icon: Mail, color: 'bg-blue-100 text-blue-700' },
  SMS: { icon: SmsIcon, color: 'bg-green-100 text-green-700' },
  WHATSAPP: { icon: SmsIcon, color: 'bg-emerald-100 text-emerald-700' },
  AIRBNB: { icon: Sparkles, color: 'bg-rose-100 text-rose-700' },
  BOOKING: { icon: Sparkles, color: 'bg-indigo-100 text-indigo-700' },
}

const variables = [
  { key: '{{prenom}}', desc: 'Prénom du voyageur' },
  { key: '{{nom_complet}}', desc: 'Nom complet' },
  { key: '{{propriete}}', desc: 'Nom de la propriété' },
  { key: '{{adresse}}', desc: 'Adresse complète' },
  { key: '{{checkin}}', desc: 'Date de check-in' },
  { key: '{{checkout}}', desc: 'Date de check-out' },
  { key: '{{heure_checkin}}', desc: 'Heure check-in' },
  { key: '{{heure_checkout}}', desc: 'Heure check-out' },
  { key: '{{code_acces}}', desc: 'Code d\'accès' },
  { key: '{{wifi_nom}}', desc: 'Nom du WiFi' },
  { key: '{{wifi_mdp}}', desc: 'Mot de passe WiFi' },
  { key: '{{nb_voyageurs}}', desc: 'Nombre de voyageurs' },
]

interface TemplateForm {
  name: string
  trigger: MessageTrigger
  channel: MessageChannel
  subject: string
  content: string
  language: Language
}

const emptyForm: TemplateForm = {
  name: '',
  trigger: 'BOOKING_CONFIRMED',
  channel: 'EMAIL',
  subject: '',
  content: '',
  language: 'fr',
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TemplateForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function fetchTemplates() {
    const { data } = await supabase
      .from('message_templates')
      .select('*')
      .order('trigger')
    setTemplates((data as MessageTemplate[]) ?? [])
    setIsLoading(false)
  }

  useEffect(() => {
    fetchTemplates()
  }, [supabase])

  function openNew() {
    setForm(emptyForm)
    setEditingId(null)
    setError(null)
    setDialogOpen(true)
  }

  function openEdit(tpl: MessageTemplate) {
    setForm({
      name: tpl.name,
      trigger: tpl.trigger,
      channel: tpl.channel,
      subject: tpl.subject ?? '',
      content: tpl.content,
      language: tpl.language,
    })
    setEditingId(tpl.id)
    setError(null)
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.name || !form.content) {
      setError('Nom et contenu sont obligatoires.')
      return
    }
    setSaving(true)
    setError(null)

    if (editingId) {
      const { error: err } = await supabase
        .from('message_templates')
        .update({
          name: form.name,
          trigger: form.trigger,
          channel: form.channel,
          subject: form.subject || null,
          content: form.content,
          language: form.language,
        })
        .eq('id', editingId)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      // On récupère l'organization_id du premier template ou on essaie depuis l'utilisateur
      const orgId = templates[0]?.organization_id
      if (!orgId) {
        // Tenter de récupérer depuis la session
        const { data: userData } = await supabase.from('users').select('organization_id').limit(1).single()
        if (!userData) { setError('Organisation introuvable.'); setSaving(false); return }
        const { error: err } = await supabase.from('message_templates').insert({
          organization_id: userData.organization_id,
          name: form.name,
          trigger: form.trigger,
          channel: form.channel,
          subject: form.subject || null,
          content: form.content,
          active: true,
          language: form.language,
        })
        if (err) { setError(err.message); setSaving(false); return }
      } else {
        const { error: err } = await supabase.from('message_templates').insert({
          organization_id: orgId,
          name: form.name,
          trigger: form.trigger,
          channel: form.channel,
          subject: form.subject || null,
          content: form.content,
          active: true,
          language: form.language,
        })
        if (err) { setError(err.message); setSaving(false); return }
      }
    }

    setSaving(false)
    setDialogOpen(false)
    fetchTemplates()
  }

  async function toggleActive(tpl: MessageTemplate) {
    await supabase
      .from('message_templates')
      .update({ active: !tpl.active })
      .eq('id', tpl.id)
    fetchTemplates()
  }

  async function deleteTemplate(id: string) {
    await supabase.from('message_templates').delete().eq('id', id)
    fetchTemplates()
  }

  function insertVariable(variable: string) {
    setForm((prev) => ({ ...prev, content: prev.content + variable }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link href="/guests" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Templates de messages</h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos messages automatisés envoyés aux voyageurs
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openNew}>
          <Plus className="h-3.5 w-3.5" />
          Nouveau template
        </Button>
      </div>

      {/* Variables reference */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold mb-2">Variables disponibles</h3>
        <div className="flex flex-wrap gap-1.5">
          {variables.map((v) => (
            <Badge
              key={v.key}
              variant="outline"
              className="text-xs cursor-help"
              title={v.desc}
            >
              {v.key}
            </Badge>
          ))}
        </div>
      </div>

      {/* Templates list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-muted" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
          <Mail className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium">Aucun template</p>
          <p className="text-xs text-muted-foreground mt-1">
            Créez votre premier template de message automatisé
          </p>
          <Button size="sm" className="mt-4 gap-1.5" onClick={openNew}>
            <Plus className="h-3.5 w-3.5" />
            Créer un template
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((tpl) => {
            const trigger = triggerLabels[tpl.trigger]
            const ch = channelConfig[tpl.channel]
            const Icon = ch?.icon ?? Mail

            return (
              <div
                key={tpl.id}
                className={cn(
                  'rounded-xl border bg-card p-4 shadow-sm transition-opacity',
                  !tpl.active && 'opacity-50'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{tpl.name}</h3>
                      <Badge className={cn('text-[10px] px-1.5 py-0', ch?.color)}>
                        <Icon className="h-2.5 w-2.5 mr-0.5" />
                        {tpl.channel}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {trigger?.label ?? tpl.trigger}
                      </Badge>
                      {!tpl.active && (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          Désactivé
                        </Badge>
                      )}
                    </div>
                    {trigger && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {trigger.description}
                      </p>
                    )}
                    {tpl.subject && (
                      <p className="mt-1 text-xs">
                        <span className="text-muted-foreground">Objet :</span> {tpl.subject}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {tpl.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleActive(tpl)}
                      title={tpl.active ? 'Désactiver' : 'Activer'}
                    >
                      {tpl.active ? (
                        <ToggleRight className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(tpl)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteTemplate(tpl.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Dialog Create/Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Modifier le template' : 'Nouveau template'}
            </DialogTitle>
            <DialogDescription>
              Les variables entre {'{{'}accolades{'}}'} seront remplacées par les données du voyageur.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nom du template *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Message de bienvenue"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Déclencheur</Label>
                <Select value={form.trigger} onValueChange={(v) => setForm((f) => ({ ...f, trigger: v as MessageTrigger }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(triggerLabels).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Canal</Label>
                <Select value={form.channel} onValueChange={(v) => setForm((f) => ({ ...f, channel: v as MessageChannel }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Langue</Label>
                <Select value={form.language} onValueChange={(v) => setForm((f) => ({ ...f, language: v as Language }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.channel === 'EMAIL' && (
              <div className="space-y-1.5">
                <Label>Objet de l'email</Label>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="Ex: Bienvenue chez {{propriete}} !"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Contenu du message *</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                placeholder="Bonjour {{prenom}}, nous avons le plaisir de confirmer votre réservation..."
                className="min-h-32 resize-none"
              />
            </div>

            {/* Quick variable insertion */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Insérer une variable :</p>
              <div className="flex flex-wrap gap-1">
                {variables.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVariable(v.key)}
                    className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] hover:bg-accent transition-colors"
                    title={v.desc}
                  >
                    {v.key}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editingId ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
