/** 双开门冰箱：左冷冻 · 右冷藏，每侧 7 格（0–4 抽拉层，5–6 抽屉） */

export type FridgeSide = 'freezer' | 'fridge'

export const SLOTS_PER_SIDE = 7

export function slotKind(index: number): 'pull' | 'drawer' {
  return index < 5 ? 'pull' : 'drawer'
}

/** 自上而下展示：0 为最上层抽拉 */
export function slotTitle(side: FridgeSide, index: number): string {
  const zone = side === 'freezer' ? '冷冻' : '冷藏'
  if (index < 5) return `${zone} · 第 ${index + 1} 层`
  return index === 5 ? `${zone} · 上抽屉` : `${zone} · 下抽屉`
}

export function sideLabel(side: FridgeSide): string {
  return side === 'freezer' ? '冷冻' : '冷藏'
}
