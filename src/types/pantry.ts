export type FoodCategory =
  | 'vegetable'
  | 'meat'
  | 'seafood'
  | 'fruit'
  | 'dairy'
  | 'egg'
  | 'grain'
  | 'seasoning'
  | 'other'

export interface PantryItem {
  id: string
  name: string
  category: FoodCategory
  amount: string
  addedAt: number
  expiresAt: number
  defaultShelfLife: number
}

export type FreshnessStatus = 'fresh' | 'expiring' | 'expired'

export function getFreshnessStatus(item: PantryItem): FreshnessStatus {
  const now = Date.now()
  if (now >= item.expiresAt) return 'expired'
  const daysLeft = (item.expiresAt - now) / (1000 * 60 * 60 * 24)
  if (daysLeft <= 3) return 'expiring'
  return 'fresh'
}

export function getDaysLeft(item: PantryItem): number {
  const ms = item.expiresAt - Date.now()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}
