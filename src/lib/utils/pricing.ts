import type { PricingRule } from '@/lib/supabase/types'

interface PriceBreakdown {
  basePrice: number
  adjustments: { rule: string; amount: number }[]
  finalPrice: number
}

/**
 * Calcule le prix recommandé en appliquant les règles tarifaires par priorité
 */
export function calculateRecommendedPrice(
  basePrice: number,
  rules: PricingRule[],
  date: Date,
  stayLength: number
): PriceBreakdown {
  const activeRules = rules
    .filter((rule) => {
      if (!rule.active) return false
      if (rule.start_date && new Date(rule.start_date) > date) return false
      if (rule.end_date && new Date(rule.end_date) < date) return false
      if (rule.min_stay && stayLength < rule.min_stay) return false
      if (rule.max_stay && stayLength > rule.max_stay) return false
      return true
    })
    .sort((a, b) => a.priority - b.priority)

  let currentPrice = basePrice
  const adjustments: PriceBreakdown['adjustments'] = []

  for (const rule of activeRules) {
    let adjustment: number
    if (rule.adjustment_type === 'PERCENTAGE') {
      adjustment = currentPrice * (rule.adjustment_value / 100)
    } else {
      adjustment = rule.adjustment_value
    }
    adjustments.push({ rule: rule.name, amount: adjustment })
    currentPrice += adjustment
  }

  return {
    basePrice,
    adjustments,
    finalPrice: Math.max(0, Math.round(currentPrice * 100) / 100),
  }
}
