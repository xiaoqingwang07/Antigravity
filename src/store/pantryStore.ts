import { makeAutoObservable, autorun } from 'mobx'
import Taro from '@tarojs/taro'
import type { PantryItem, FoodCategory } from '../types/pantry'

const FOOD_CATEGORIES: FoodCategory[] = [
  'vegetable', 'meat', 'seafood', 'fruit', 'dairy', 'egg', 'grain', 'seasoning', 'other',
]

function isValidPantryRow(x: unknown): x is PantryItem {
  if (x === null || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  if (typeof o.id !== 'string' || !o.id.trim()) return false
  if (typeof o.name !== 'string' || !o.name.trim()) return false
  if (typeof o.category !== 'string' || !(FOOD_CATEGORIES as string[]).includes(o.category)) return false
  if (typeof o.amount !== 'string') return false
  if (typeof o.addedAt !== 'number' || !Number.isFinite(o.addedAt)) return false
  if (typeof o.expiresAt !== 'number' || !Number.isFinite(o.expiresAt)) return false
  if (typeof o.defaultShelfLife !== 'number' || !Number.isFinite(o.defaultShelfLife) || o.defaultShelfLife <= 0) return false
  return true
}

/** 从 Storage 解析后的原始数据过滤出合法项；若无法得到任何合法项则返回 null，由调用方回退 Mock */
function sanitizeStoredItems(raw: unknown): PantryItem[] | null {
  if (!Array.isArray(raw)) return null
  const valid = raw.filter(isValidPantryRow)
  return valid.length > 0 ? valid : null
}
import { getFreshnessStatus, getDaysLeft } from '../types/pantry'
import { getShelfLifeDays, getCategoryForName } from '../data/shelfLife'

const STORAGE_KEY = 'pantryItems'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function createMockData(): PantryItem[] {
  const now = Date.now()
  const DAY = 24 * 60 * 60 * 1000

  const mocks: { name: string; amount: string; daysAgo: number; shelfDays: number }[] = [
    // 临期：入库较早，快到保质期
    { name: '菠菜', amount: '1把', daysAgo: 2, shelfDays: 3 },
    { name: '豆腐', amount: '1盒', daysAgo: 3, shelfDays: 4 },
    { name: '鸡胸肉', amount: '300g', daysAgo: 1, shelfDays: 2 },
    { name: '虾仁', amount: '200g', daysAgo: 1, shelfDays: 2 },
    { name: '草莓', amount: '1盒', daysAgo: 2, shelfDays: 3 },
    // 新鲜：刚入库
    { name: '西红柿', amount: '3个', daysAgo: 1, shelfDays: 5 },
    { name: '鸡蛋', amount: '10个', daysAgo: 2, shelfDays: 30 },
    { name: '土豆', amount: '500g', daysAgo: 1, shelfDays: 14 },
    { name: '洋葱', amount: '2个', daysAgo: 0, shelfDays: 14 },
    { name: '牛奶', amount: '1L', daysAgo: 1, shelfDays: 7 },
    { name: '五花肉', amount: '400g', daysAgo: 0, shelfDays: 3 },
    { name: '青椒', amount: '3个', daysAgo: 0, shelfDays: 5 },
    { name: '大蒜', amount: '1头', daysAgo: 0, shelfDays: 180 },
    // 已过期
    { name: '香蕉', amount: '3根', daysAgo: 5, shelfDays: 4 },
    { name: '生菜', amount: '1颗', daysAgo: 4, shelfDays: 3 },
  ]

  return mocks.map(m => {
    const addedAt = now - m.daysAgo * DAY
    return {
      id: generateId(),
      name: m.name,
      category: getCategoryForName(m.name),
      amount: m.amount,
      addedAt,
      expiresAt: addedAt + m.shelfDays * DAY,
      defaultShelfLife: m.shelfDays,
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

  get expiringItems(): PantryItem[] {
    return this.items.filter(i => getFreshnessStatus(i) === 'expiring')
  }

  get expiredItems(): PantryItem[] {
    return this.items.filter(i => getFreshnessStatus(i) === 'expired')
  }

  get freshItems(): PantryItem[] {
    return this.items.filter(i => getFreshnessStatus(i) === 'fresh')
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

  addItem(name: string, amount: string, category?: FoodCategory) {
    const cat = category || getCategoryForName(name)
    const shelfDays = getShelfLifeDays(name)
    const now = Date.now()
    const item: PantryItem = {
      id: generateId(),
      name,
      category: cat,
      amount,
      addedAt: now,
      expiresAt: now + shelfDays * 24 * 60 * 60 * 1000,
      defaultShelfLife: shelfDays,
    }
    this.items.push(item)
  }

  removeItem(id: string) {
    this.items = this.items.filter(i => i.id !== id)
  }

  removeExpired() {
    this.items = this.items.filter(i => getFreshnessStatus(i) !== 'expired')
  }

  deductItems(ingredientNames: string[]) {
    const namesToDeduct = new Set(ingredientNames.map(n => n.trim()))
    const toRemoveIds: string[] = []

    for (const name of namesToDeduct) {
      const match = this.items.find(i => i.name === name)
      if (match) {
        toRemoveIds.push(match.id)
      }
    }

    if (toRemoveIds.length > 0) {
      this.items = this.items.filter(i => !toRemoveIds.includes(i.id))
    }

    return toRemoveIds.length
  }

  resetToMock() {
    this.items = createMockData()
  }
}

export const pantryStore = new PantryStore()
