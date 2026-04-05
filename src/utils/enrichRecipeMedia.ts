import { FOOD_IMAGE_POOL } from '../data/foodStockPhotos'
import type { Recipe } from '../types/recipe'

function simpleHash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function pickImage(seed: string, offset = 0): string {
  const pool = FOOD_IMAGE_POOL
  if (!pool.length) return ''
  const i = (simpleHash(seed) + offset) % pool.length
  return pool[i]
}

/** 为缺省封面与各步配图补全 Unsplash 食物图（已有 URL 不覆盖；无 steps 时不写入 undefined 以免覆盖原数据） */
export function enrichRecipeMedia(recipe: Recipe): Recipe {
  const idSeed = `${recipe.id}-${recipe.title}`
  const image = recipe.image?.trim() ? recipe.image : pickImage(idSeed, 0)
  if (!recipe.steps?.length) {
    return { ...recipe, image }
  }
  const steps = recipe.steps.map((step, idx) => {
    if (step.image?.trim()) return step
    const url = pickImage(`${idSeed}-step-${idx}`, idx + 7)
    return { ...step, ...(url ? { image: url } : {}) }
  })
  return { ...recipe, image, steps }
}
