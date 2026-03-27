import { DEFAULT_RECIPES } from '../data/recipes'
import type { Recipe } from '../types/recipe'

export interface MatchResult {
  recipe: Recipe
  matchedIngredients: string[]
  matchCount: number
  coverageRate: number
}

/**
 * 根据选中的食材名称，在预埋菜谱库中匹配最合适的菜谱。
 * 排序规则：匹配食材数 * 2 + 覆盖率，优先推荐能最大化消耗已选食材的菜式。
 */
export function matchRecipes(selectedIngredients: string[], limit: number = 6): MatchResult[] {
  if (selectedIngredients.length === 0) return []

  const selected = new Set(selectedIngredients.map(s => s.trim()))

  const results: MatchResult[] = DEFAULT_RECIPES
    .map(recipe => {
      const recipeIngredientNames = (recipe.ingredients || []).map(i => i.name)
      const matched = recipeIngredientNames.filter(name =>
        selected.has(name) || [...selected].some(s => name.includes(s) || s.includes(name))
      )
      const matchCount = matched.length
      const coverageRate = recipeIngredientNames.length > 0
        ? matchCount / recipeIngredientNames.length
        : 0

      return {
        recipe,
        matchedIngredients: matched,
        matchCount,
        coverageRate,
      }
    })
    .filter(r => r.matchCount > 0)
    .sort((a, b) => {
      const scoreA = a.matchCount * 2 + a.coverageRate
      const scoreB = b.matchCount * 2 + b.coverageRate
      return scoreB - scoreA
    })
    .slice(0, limit)

  return results
}

/**
 * 简化版：直接返回 Recipe[]，便于结果页使用
 */
export function matchRecipesSimple(selectedIngredients: string[], limit: number = 6): Recipe[] {
  return matchRecipes(selectedIngredients, limit).map(r => ({
    ...r.recipe,
    isFavorite: false,
  }))
}
