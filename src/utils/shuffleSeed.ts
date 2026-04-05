/** 同日同顺序的「随机」列表，避免无意义抖动 */
export function daySeed(): number {
  const d = new Date()
  const start = new Date(d.getFullYear(), 0, 0).getTime()
  return Math.floor((d.getTime() - start) / 86400000)
}

export function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  return [...arr]
    .map((item, i) => ({
      item,
      k: Math.sin(seed * 999 + i * 12.9898) * 43758.5453 - Math.floor(Math.sin(seed * 999 + i * 12.9898) * 43758.5453),
    }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.item)
}
