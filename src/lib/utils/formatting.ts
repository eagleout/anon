/**
 * Formatage des montants en euros
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

/**
 * Formatage d'un pourcentage
 */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

/**
 * Tronquer un texte avec ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Initiales d'un nom complet
 */
export function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Formater le nombre de nuits
 */
export function formatNights(checkin: string, checkout: string): string {
  const diff = new Date(checkout).getTime() - new Date(checkin).getTime()
  const nights = Math.ceil(diff / (1000 * 60 * 60 * 24))
  return `${nights} nuit${nights > 1 ? 's' : ''}`
}
