import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, differenceInDays } from 'date-fns'
import { fr } from 'date-fns/locale'

/**
 * Formater une date en format court (13 mars 2026)
 */
export function formatDate(date: string | Date): string {
  return format(new Date(date), 'd MMMM yyyy', { locale: fr })
}

/**
 * Formater une date en format court sans année (13 mars)
 */
export function formatDateShort(date: string | Date): string {
  return format(new Date(date), 'd MMM', { locale: fr })
}

/**
 * Formater une heure (14:30)
 */
export function formatTime(time: string): string {
  return time.slice(0, 5)
}

/**
 * Date relative ("il y a 3 heures", "dans 2 jours")
 */
export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr })
}

/**
 * Label intelligent pour une date (Aujourd'hui, Demain, Hier, ou date)
 */
export function formatSmartDate(date: string | Date): string {
  const d = new Date(date)
  if (isToday(d)) return "Aujourd'hui"
  if (isTomorrow(d)) return 'Demain'
  if (isYesterday(d)) return 'Hier'
  return formatDate(d)
}

/**
 * Nombre de jours entre deux dates
 */
export function daysBetween(start: string | Date, end: string | Date): number {
  return differenceInDays(new Date(end), new Date(start))
}
