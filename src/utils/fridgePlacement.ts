import type { FoodCategory } from '../types/pantry'
import type { FridgeSide } from '../types/fridge'
import type { PantryItem } from '../types/pantry'

const FROZEN_KW = ['冻', '速冻', '冷冻', '冰', '冰淇淋', '雪糕', '冰棒', '水饺', '馄饨', '汤圆', '冰棍', '雪柜']

function prefersFreezer(name: string, category: FoodCategory): boolean {
  if (FROZEN_KW.some((k) => name.includes(k))) return true
  if (category === 'grain' && /饺|包|丸/.test(name)) return true
  return false
}

/** 在已有库存上找最不拥挤的推荐格（同侧内优先顺序可配） */
export function suggestPlacementWithBalance(
  name: string,
  category: FoodCategory,
  existing: PantryItem[]
): { side: FridgeSide; slotIndex: number } {
  const side: FridgeSide = prefersFreezer(name, category) ? 'freezer' : 'fridge'

  let order = [2, 3, 1, 4, 0, 5, 6]
  if (category === 'dairy' || category === 'egg') order = [5, 6, 4, 3, 2, 1, 0]
  if (category === 'vegetable' || category === 'fruit') order = [1, 2, 3, 0, 4, 5, 6]
  if (category === 'meat' || category === 'seafood') order = side === 'freezer' ? [5, 6, 4, 3, 2, 1, 0] : [4, 3, 5, 6, 2, 1, 0]
  if (side === 'freezer') order = [0, 1, 2, 5, 6, 3, 4]

  const counts = new Map<number, number>()
  for (let i = 0; i < 7; i++) counts.set(i, 0)
  for (const it of existing) {
    if (it.side === side && typeof it.slotIndex === 'number' && it.slotIndex >= 0 && it.slotIndex < 7) {
      counts.set(it.slotIndex, (counts.get(it.slotIndex) || 0) + 1)
    }
  }

  let best = order[0]
  let bestC = Infinity
  for (const idx of order) {
    const c = counts.get(idx) || 0
    if (c < bestC) {
      bestC = c
      best = idx
    }
  }
  return { side, slotIndex: best }
}

/** 购物清单：每行「名称 数量」或「名称、数量」 */
export function parseShoppingLines(text: string): { name: string; amount: string }[] {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
  const out: { name: string; amount: string }[] = []
  for (const line of lines) {
    const parts = line.split(/[，,、\t]+/).map((s) => s.trim()).filter(Boolean)
    if (parts.length >= 2) {
      out.push({ name: parts[0], amount: parts.slice(1).join(' ') })
    } else {
      const m = line.match(/^(.+?)[\s]+([\d.]+\s*\w+|[一二三四五六七八九十两半斤克千克公斤个只盒包袋把根条适量.+]+)$/u)
      if (m) out.push({ name: m[1].trim(), amount: m[2].trim() })
      else out.push({ name: line, amount: '适量' })
    }
  }
  return out
}
