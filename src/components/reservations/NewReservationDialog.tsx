'use client'

import { useState, useEffect } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import type { Property, ReservationPlatform } from '@/lib/supabase/types'

interface NewReservationDialogProps {
  onCreated?: () => void
}

const emptyForm = {
  property_id: '',
  platform: 'MANUAL' as ReservationPlatform,
  guest_name: '',
  guest_email: '',
  guest_phone: '',
  guest_count: 2,
  checkin_date: '',
  checkout_date: '',
  checkin_time: '15:00',
  checkout_time: '11:00',
  amount_gross: 0,
  platform_fee: 0,
  concierge_fee: 0,
  notes: '',
}

export function NewReservationDialog({ onCreated }: NewReservationDialogProps) {
  const [open, setOpen] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!open) return
    async function loadProperties() {
      const { data } = await supabase.from('properties').select('*').eq('status', 'ACTIVE').order('name')
      setProperties((data as Property[]) ?? [])
    }
    loadProperties()
  }, [open, supabase])

  function updateField<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.property_id || !form.guest_name || !form.checkin_date || !form.checkout_date) {
      setError('Veuillez remplir tous les champs obligatoires.')
      return
    }

    setSaving(true)

    // Récupérer l'organization_id depuis la propriété sélectionnée
    const prop = properties.find((p) => p.id === form.property_id)
    if (!prop) {
      setError('Propriété introuvable.')
      setSaving(false)
      return
    }

    const amountNet = form.amount_gross - form.platform_fee - form.concierge_fee

    const { error: insertError } = await supabase.from('reservations').insert({
      property_id: form.property_id,
      organization_id: prop.organization_id,
      platform: form.platform,
      guest_name: form.guest_name,
      guest_email: form.guest_email || null,
      guest_phone: form.guest_phone || null,
      guest_count: form.guest_count,
      checkin_date: form.checkin_date,
      checkout_date: form.checkout_date,
      checkin_time: form.checkin_time,
      checkout_time: form.checkout_time,
      status: 'PENDING',
      amount_gross: form.amount_gross,
      amount_net: amountNet,
      platform_fee: form.platform_fee,
      concierge_fee: form.concierge_fee,
      notes: form.notes || null,
    })

    setSaving(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setForm(emptyForm)
    setOpen(false)
    onCreated?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5" />
        }
      >
        <Plus className="h-3.5 w-3.5" />
        Nouvelle
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvelle réservation</DialogTitle>
          <DialogDescription>
            Créez une réservation manuelle pour un voyageur.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Propriété + Plateforme */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="property">Propriété *</Label>
              <Select value={form.property_id} onValueChange={(v) => updateField('property_id', v ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="platform">Plateforme</Label>
              <Select value={form.platform} onValueChange={(v) => updateField('platform', (v ?? 'MANUAL') as ReservationPlatform)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AIRBNB">Airbnb</SelectItem>
                  <SelectItem value="BOOKING">Booking</SelectItem>
                  <SelectItem value="VRBO">VRBO</SelectItem>
                  <SelectItem value="DIRECT">Direct</SelectItem>
                  <SelectItem value="MANUAL">Manuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Voyageur */}
          <div className="space-y-1.5">
            <Label htmlFor="guest_name">Nom du voyageur *</Label>
            <Input
              id="guest_name"
              value={form.guest_name}
              onChange={(e) => updateField('guest_name', e.target.value)}
              placeholder="Jean Dupont"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="guest_email">Email</Label>
              <Input
                id="guest_email"
                type="email"
                value={form.guest_email}
                onChange={(e) => updateField('guest_email', e.target.value)}
                placeholder="jean@email.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guest_phone">Téléphone</Label>
              <Input
                id="guest_phone"
                value={form.guest_phone}
                onChange={(e) => updateField('guest_phone', e.target.value)}
                placeholder="+33 6 12 34 56 78"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="checkin_date">Check-in *</Label>
              <Input
                id="checkin_date"
                type="date"
                value={form.checkin_date}
                onChange={(e) => updateField('checkin_date', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="checkout_date">Check-out *</Label>
              <Input
                id="checkout_date"
                type="date"
                value={form.checkout_date}
                onChange={(e) => updateField('checkout_date', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="checkin_time">Heure check-in</Label>
              <Input
                id="checkin_time"
                type="time"
                value={form.checkin_time}
                onChange={(e) => updateField('checkin_time', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="checkout_time">Heure check-out</Label>
              <Input
                id="checkout_time"
                type="time"
                value={form.checkout_time}
                onChange={(e) => updateField('checkout_time', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guest_count">Voyageurs</Label>
              <Input
                id="guest_count"
                type="number"
                min={1}
                max={20}
                value={form.guest_count}
                onChange={(e) => updateField('guest_count', Number(e.target.value))}
              />
            </div>
          </div>

          {/* Finances */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount_gross">Montant brut (€)</Label>
              <Input
                id="amount_gross"
                type="number"
                step="0.01"
                min={0}
                value={form.amount_gross || ''}
                onChange={(e) => updateField('amount_gross', Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="platform_fee">Comm. plateforme</Label>
              <Input
                id="platform_fee"
                type="number"
                step="0.01"
                min={0}
                value={form.platform_fee || ''}
                onChange={(e) => updateField('platform_fee', Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="concierge_fee">Comm. conciergerie</Label>
              <Input
                id="concierge_fee"
                type="number"
                step="0.01"
                min={0}
                value={form.concierge_fee || ''}
                onChange={(e) => updateField('concierge_fee', Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Instructions spéciales, demandes du voyageur..."
              className="min-h-16 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={saving} className="gap-1.5">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Créer la réservation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
