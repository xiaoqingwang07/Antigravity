import { makeAutoObservable, autorun } from 'mobx'
import Taro from '@tarojs/taro'
import type { PantryItem, FoodCategory } from '../types/pantry'
import type { FridgeSide } from '../types/fridge'
import { getFreshnessStatus, getDaysLeft } from '../types/pantry'
import { getShelfLifeDays, getCategoryForName } from '../data/shelfLife'
import { findPantryItemForRecipeIngredient } from '../utils/ingredientMatch'
import { suggestPlacementWithBalance } from '../utils/fridgePlacement'

const FOOD_CATEGORIES: FoodCategory[] = [
  'vegetable', 'meat', 'seafood', 'fruit', 'dairy', 'egg', 'grain', 'seasoning', 'other',
]

type PartialRow = Omit<PantryItem, 'side' | 'slotIndex'> & { side?: FridgeSide; slotIndex?: number }

function parseRow(x: unknown): PartialRow | null {
  if (x === null || typeof x !== 'object') return null
  const o = x as Record<string, unknown>
  if (typeof o.id !== 'string' || !o.id.trim()) return null
  if (typeof o.name !== 'string' || !o.name.trim()) return null
  if (typeof o.category !== 'string' || !(FOOD_CATEGORIES as string[]).includes(o.category)) return null
  if (typeof o.amount !== 'string') return null
  if (typeof o.addedAt !== 'number' || !Number.isFinite(o.addedAt)) return null
  if (typeof o.expiresAt !== 'number' || !Number.isFinite(o.expiresAt)) return null
  if (typeof o.defaultShelfLife !== 'number' || !Number.isFinite(o.defaultShelfLife) || o.defaultShelfLife <= 0) return null
  if (o.side !== undefined && o.side !== 'freezer' && o.side !== 'fridge') return null
  if (o.slotIndex !== undefined && (typeof o.slotIndex !== 'number' || o.slotIndex < 0 || o.slotIndex > 6)) return null
  return o as PartialRow
}

function normalizeToPantryItems(partials: PartialRow[]): PantryItem[] {
  const out: PantryItem[] = []
  for (const p of partials) {
    if (p.side && p.slotIndex !== undefined && p.slotIndex >= 0 && p.slotIndex <= 6) {
      out.push(p as PantryItem)
    } else {
      const { side, slotIndex } = suggestPlacementWithBalance(p.name, p.category, out)
      out.push({ ...p, side, slotIndex })
    }
  }
  return out
}

function sanitizeStoredItems(raw: unknown): PantryItem[] | null {
  if (!Array.isArray(raw)) return null
  const partials = raw.map(parseRow).filter((x): x is PartialRow => x !== null)
  if (partials.length === 0) return null
  return normalizeToPantryItems(partials)
}

const STORAGE_KEY = 'pantryItems'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function createMockData(): PantryItem[] {
  const now = Date.now()
  const DAY = 24 * 60 * 60 * 1000

  const mocks: {
    name: string
    amount: string
    daysAgo: number
    shelfDays: number
    side: FridgeSide
    slotIndex: number
  }[] = [
    { name: '速冻水饺', amount: '1袋', daysAgo: 20, shelfDays: 180, side: 'freezer', slotIndex: 0 },
    { name: '冰淇淋', amount: '4支', daysAgo: 5, shelfDays: 365, side: 'freezer', slotIndex: 1 },
    { name: '冻虾仁', amount: '200g', daysAgo: 8, shelfDays: 90, side: 'freezer', slotIndex: 5 },
    { name: '菠菜', amount: '1把', daysAgo: 2, shelfDays: 3, side: 'fridge', slotIndex: 2 },
    { name: '豆腐', amount: '1盒', daysAgo: 3, shelfDays: 4, side: 'fridge', slotIndex: 5 },
    { name: '鸡胸肉', amount: '300g', daysAgo: 1, shelfDays: 2, side: 'fridge', slotIndex: 4 },
    { name: '虾仁', amount: '200g', daysAgo: 1, shelfDays: 2, side: 'fridge', slotIndex: 3 },
    { name: '草莓', amount: '1盒', daysAgo: 2, shelfDays: 3, side: 'fridge', slotIndex: 2 },
    { name: '西红柿', amount: '3个', daysAgo: 1, shelfDays: 5, side: 'fridge', slotIndex: 1 },
    { name: '鸡蛋', amount: '10个', daysAgo: 2, shelfDays: 30, side: 'fridge', slotIndex: 5 },
    { name: '土豆', amount: '500g', daysAgo: 1, shelfDays: 14, side: 'fridge', slotIndex: 0 },
    { name: '洋葱', amount: '2个', daysAgo: 0, shelfDays: 14, side: 'fridge', slotIndex: 0 },
    { name: '牛奶', amount: '1L', daysAgo: 1, shelfDays: 7, side: 'fridge', slotIndex: 6 },
    { name: '五花肉', amount: '400g', daysAgo: 0, shelfDays: 3, side: 'fridge', slotIndex: 6 },
    { name: '青椒', amount: '3个', daysAgo: 0, shelfDays: 5, side: 'fridge', slotIndex: 1 },
    { name: '大蒜', amount: '1头', daysAgo: 0, shelfDays: 180, side: 'fridge', slotIndex: 3 },
    { name: '香蕉', amount: '3根', daysAgo: 5, shelfDays: 4, side: 'fridge', slotIndex: 2 },
    { name: '生菜', amount: '1颗', daysAgo: 4, shelfDays: 3, side: 'fridge', slotIndex: 1 },
  ]

  return mocks.map((m) => {
    const addedAt = now - m.daysAgo * DAY
    return {
      id: generateId(),
      name: m.name,
      category: getCategoryForName(m.name),
      amount: m.amount,
      addedAt,
      expiresAt: addedAt + m.shelfDays * DAY,
      defaultShelfLife: m.shelfDays,
      side: m.side,
      slotIndex: m.slotIndex,
    }
  })
}

export class PantryStore {
  items: PantryItem[] = []

  constructor() {
    makeAutoObservable(this)
    this.loadFromStorage()

    autorun(() => {
      try {
        Taro.setStorageSync(STORAGE_KEY, JSON.stringify(this.items))
      } catch (e) {
        console.error('PantryStore persist failed:', e)
      }
    })
  }

  private loadFromStorage() {
    try {
      const raw = Taro.getStorageSync(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as unknown
        const sanitized = sanitizeStoredItems(parsed)
        if (sanitized) {
          this.items = sanitized
          return
        }
      }
    } catch (e) {
      console.error('PantryStore load failed:', e)
    }
    this.items = createMockData()
  }

  itemsInSlot(side: FridgeSide, slotIndex: number): PantryItem[] {
    return this.items.filter((i) => i.side === side && i.slotIndex === slotIndex)
  }

  get expiringItems(): PantryItem[] {
    return this.items.filter((i) => getFreshnessStatus(i) === 'expiring')
  }

  get expiredItems(): PantryItem[] {
    return this.items.filter((i) => getFreshnessStatus(i) === 'expired')
  }

  get freshItems(): PantryItem[] {
    return this.items.filter((i) => getFreshnessStatus(i) === 'fresh')
  }

  get sortedByExpiry(): PantryItem[] {
    return [...this.items].sort((a, b) => a.expiresAt - b.expiresAt)
  }

  get totalCount(): number {
    return this.items.length
  }

  get expiringCount(): number {
    return this.expiringItems.length
  }

  get expiredCount(): number {
    return this.expiredItems.length
  }

  addItem(
    name: string,
    amount: string,
    opts?: { category?: FoodCategory; side?: FridgeSide; slotIndex?: number }
  ) {
    const cat = opts?.category ?? getCategoryForName(name)
    const shelfDays = getShelfLifeDays(name)
    const now = Date.now()
    let side: FridgeSide
    let slotIndex: number
    if (opts?.side !== undefined && opts?.slotIndex !== undefined) {
      side = opts.side
      slotIndex = Math.max(0, Math.min(6, opts.slotIndex))
    } else {
      const p = suggestPlacementWithBalance(name, cat, this.items)
      side = p.side
      slotIndex = p.slotIndex
    }
    const item: PantryItem = {
      id: generateId(),
      name,
      category: cat,
      amount,
      addedAt: now,
      expiresAt: now + shelfDays * 24 * 60 * 60 * 1000,
      defaultShelfLife: shelfDays,
      side,
      slotIndex,
    }
    this.items.push(item)
  }

  moveItem(id: string, side: FridgeSide, slotIndex: number) {
    const idx = this.items.findIndex((i) => i.id === id)
    if (idx < 0) return
    const slot = Math.max(0, Math.min(6, slotIndex))
    this.items[idx] = { ...this.items[idx], side, slotIndex: slot }
  }

  removeItem(id: string) {
    this.items = this.items.filter((i) => i.id !== id)
  }

  removeExpired() {
    this.items = this.items.filter((i) => getFreshnessStatus(i) !== 'expired')
  }

  deductItems(ingredientNames: string[]) {
    let pool = [...this.items]
    const toRemoveIds: string[] = []

    for (const raw of ingredientNames) {
      const name = raw.trim()
      if (!name) continue
      const match = findPantryItemForRecipeIngredient(pool, name)
      if (match) {
        toRemoveIds.push(match.id)
        pool = pool.filter((i) => i.id !== match.id)
      }
    }

    if (toRemoveIds.length > 0) {
      this.items = this.items.filter((i) => !toRemoveIds.includes(i.id))
    }

    return toRemoveIds.length
  }

  resetToMock() {
    this.items = createMockData()
  }
}

export const pantryStore = new PantryStore()
