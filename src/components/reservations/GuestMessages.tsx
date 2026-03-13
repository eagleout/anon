'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Bot, Mail, MessageSquare as SmsIcon, Sparkles, FileText, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useMessages } from '@/lib/hooks/useMessages'
import { formatRelative } from '@/lib/utils/dates'
import type { Message, MessageTemplate, Reservation, Property } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'
import { resolveTemplate } from '@/lib/utils/messages'

const channelIcons: Record<string, typeof Mail> = {
  EMAIL: Mail,
  SMS: SmsIcon,
  AIRBNB: Sparkles,
  BOOKING: Sparkles,
  WHATSAPP: SmsIcon,
}

const channelColors: Record<string, string> = {
  EMAIL: 'bg-blue-100 text-blue-700',
  SMS: 'bg-green-100 text-green-700',
  AIRBNB: 'bg-rose-100 text-rose-700',
  BOOKING: 'bg-indigo-100 text-indigo-700',
  WHATSAPP: 'bg-emerald-100 text-emerald-700',
}

const triggerLabels: Record<string, string> = {
  BOOKING_CONFIRMED: 'Confirmation',
  J_MINUS_7: 'J-7',
  J_MINUS_3: 'J-3',
  J_MINUS_1: 'J-1',
  DAY_PLUS_1: 'J+1',
  CHECKOUT_MINUS_1: 'Départ J-1',
  CHECKOUT_PLUS_1: 'Post-séjour',
}

function MessageBubble({ message }: { message: Message }) {
  const isOutbound = message.direction === 'OUTBOUND'
  const Icon = channelIcons[message.channel] ?? Mail

  return (
    <div
      className={cn(
        'flex gap-2 max-w-[85%]',
        isOutbound ? 'ml-auto flex-row-reverse' : ''
      )}
    >
      <div
        className={cn(
          'rounded-xl px-4 py-2.5',
          isOutbound
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <Badge className={cn('text-[10px] px-1.5 py-0', channelColors[message.channel])}>
            <Icon className="h-2.5 w-2.5 mr-0.5" />
            {message.channel}
          </Badge>
          {message.automated && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              <Bot className="h-2.5 w-2.5 mr-0.5" />
              Auto
            </Badge>
          )}
        </div>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p
          className={cn(
            'mt-1 text-[10px]',
            isOutbound ? 'text-primary-foreground/60' : 'text-muted-foreground'
          )}
        >
          {formatRelative(message.sent_at)}
        </p>
      </div>
    </div>
  )
}

interface GuestMessagesProps {
  reservationId: string
  organizationId: string
}

export function GuestMessages({ reservationId, organizationId }: GuestMessagesProps) {
  const { messages, isLoading } = useMessages(reservationId)
  const [newMessage, setNewMessage] = useState('')
  const [channel, setChannel] = useState('EMAIL')
  const [sending, setSending] = useState(false)
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [property, setProperty] = useState<Property | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Charger les templates et les données de la réservation
  useEffect(() => {
    async function loadData() {
      const [tplRes, resaRes] = await Promise.all([
        supabase.from('message_templates').select('*').eq('organization_id', organizationId).eq('active', true).order('trigger'),
        supabase.from('reservations').select('*').eq('id', reservationId).single(),
      ])
      setTemplates((tplRes.data as MessageTemplate[]) ?? [])
      if (resaRes.data) {
        const resa = resaRes.data as Reservation
        setReservation(resa)
        const { data: prop } = await supabase.from('properties').select('*').eq('id', resa.property_id).single()
        setProperty(prop as Property | null)
      }
    }
    loadData()
  }, [supabase, organizationId, reservationId])

  // Scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function applyTemplate(template: MessageTemplate) {
    let content = template.content
    if (reservation && property) {
      // Récupérer le nom de l'org (on utilise un fallback)
      content = resolveTemplate(content, reservation, property, 'Notre conciergerie')
    }
    setNewMessage(content)
    setChannel(template.channel)
    setShowTemplates(false)
  }

  async function handleSend() {
    if (!newMessage.trim()) return
    setSending(true)

    await supabase.from('messages').insert({
      reservation_id: reservationId,
      organization_id: organizationId,
      direction: 'OUTBOUND',
      channel,
      content: newMessage.trim(),
      sent_at: new Date().toISOString(),
      automated: false,
    })

    setNewMessage('')
    setSending(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className={cn('flex', i % 2 === 0 && 'justify-end')}>
            <div className="h-16 w-64 animate-pulse rounded-xl bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto max-h-96 px-1">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            Aucun message
          </p>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Compose */}
      <div className="mt-4 space-y-2 border-t border-border pt-4">
        <div className="flex gap-2 flex-wrap">
          <Select value={channel} onValueChange={(v) => setChannel(v ?? 'EMAIL')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EMAIL">Email</SelectItem>
              <SelectItem value="SMS">SMS</SelectItem>
              <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
            </SelectContent>
          </Select>

          {/* Template selector */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              <FileText className="h-3.5 w-3.5" />
              Templates
              <ChevronDown className={cn('h-3 w-3 transition-transform', showTemplates && 'rotate-180')} />
            </Button>
            {showTemplates && (
              <div className="absolute top-full left-0 z-50 mt-1 w-64 rounded-lg border border-border bg-popover p-1 shadow-md">
                {templates.length === 0 ? (
                  <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                    Aucun template actif
                  </p>
                ) : (
                  templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => applyTemplate(tpl)}
                      className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate">{tpl.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{tpl.content.slice(0, 60)}...</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {triggerLabels[tpl.trigger] ?? tpl.trigger}
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrire un message..."
            className="min-h-20 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSend()
              }
            }}
          />
        </div>
        <div className="flex justify-between items-center">
          <p className="text-[10px] text-muted-foreground">Ctrl+Enter pour envoyer</p>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            Envoyer
          </Button>
        </div>
      </div>
    </div>
  )
}
