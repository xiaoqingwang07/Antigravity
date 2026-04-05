import type { PantryItem } from '../types/pantry'

/** 常见同义词：菜谱用料名 vs 冰箱名称 */
const GROUPS: string[][] = [
  ['西红柿', '番茄', '圣女果'],
  ['青椒', '甜椒', '彩椒'],
  ['土豆', '马铃薯'],
  ['鸡蛋', '蛋清', '蛋黄'],
]

function sameGroup(a: string, b: string): boolean {
  const x = a.trim()
  const y = b.trim()
  if (!x || !y) return false
  for (const g of GROUPS) {
    const ix = g.some(s => x.includes(s) || s.includes(x))
    const iy = g.some(s => y.includes(s) || s.includes(y))
    if (ix && iy) return true
  }
  return false
}

export function ingredientsLikelyMatch(pantryName: string, recipeIngredientName: string): boolean {
  const p = pantryName.trim()
  const r = recipeIngredientName.trim()
  if (!p || !r) return false
  if (p === r) return true
  if (p.includes(r) || r.includes(p)) return true
  return sameGroup(p, r)
}

export function findPantryItemForRecipeIngredient(
  items: PantryItem[],
  recipeIngredientName: string
): PantryItem | undefined {
  return items.find(i => ingredientsLikelyMatch(i.name, recipeIngredientName))
}
