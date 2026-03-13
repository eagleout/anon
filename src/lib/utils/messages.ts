import type { Reservation, Property } from '@/lib/supabase/types'
import { formatDate, formatTime } from './dates'

/**
 * Variables disponibles dans les templates de messages
 */
interface TemplateVariables {
  prenom: string
  nom_complet: string
  propriete: string
  adresse: string
  checkin: string
  checkout: string
  heure_checkin: string
  heure_checkout: string
  nb_voyageurs: string
  code_acces: string
  wifi_nom: string
  wifi_mdp: string
  org_name: string
}

/**
 * Résoudre les variables dans un template de message
 */
export function resolveTemplate(
  template: string,
  reservation: Reservation,
  property: Property,
  orgName: string
): string {
  const firstName = reservation.guest_name.split(' ')[0]

  const variables: TemplateVariables = {
    prenom: firstName,
    nom_complet: reservation.guest_name,
    propriete: property.name,
    adresse: `${property.address}, ${property.zipcode} ${property.city}`,
    checkin: formatDate(reservation.checkin_date),
    checkout: formatDate(reservation.checkout_date),
    heure_checkin: formatTime(reservation.checkin_time),
    heure_checkout: formatTime(reservation.checkout_time),
    nb_voyageurs: String(reservation.guest_count),
    code_acces: property.access_code || '',
    wifi_nom: property.wifi_name || '',
    wifi_mdp: property.wifi_password || '',
    org_name: orgName,
  }

  let resolved = template
  for (const [key, value] of Object.entries(variables)) {
    resolved = resolved.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }

  return resolved
}
