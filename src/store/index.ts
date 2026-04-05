/**
 * 状态管理 - 收藏夹 & 历史记录
 */
import Taro from '@tarojs/taro'
import type { Recipe } from '../types/recipe'

// ============ Storage Keys ============
const FAVORITES_KEY = 'favoriteRecipes'
const FAVORITE_DETAILS_KEY = 'favoriteRecipeDetails'
const SEARCH_HISTORY_KEY = 'searchHistory'
const COOKED_RECIPES_KEY = 'cookedRecipes'

// ============ 收藏相关（ID 统一为字符串，兼容 AI 字符串 id 与历史数字 id） ============
export const getFavoriteIds = (): string[] => {
  try {
    const fav = Taro.getStorageSync(FAVORITES_KEY)
    if (!Array.isArray(fav)) return []
    return fav.map((x: unknown) => String(x))
  } catch { return [] }
}

export const getFavoriteDetails = (): Recipe[] => {
  try {
    const details = Taro.getStorageSync(FAVORITE_DETAILS_KEY)
    return Array.isArray(details) ? details : []
  } catch { return [] }
}

export const isFavorite = (recipeId: number | string): boolean => {
  return getFavoriteIds().includes(String(recipeId))
}

export const toggleFavorite = (recipe: Recipe): boolean => {
  const favs = getFavoriteIds()
  let details = getFavoriteDetails()
  const id = String(recipe.id)

  if (favs.includes(id)) {
    const newFavs = favs.filter((fid) => fid !== id)
    Taro.setStorageSync(FAVORITES_KEY, newFavs)
    details = details.filter((d) => String(d.id) !== id)
    Taro.setStorageSync(FAVORITE_DETAILS_KEY, details)
    return false
  }
  const newFavs = [...favs, id]
  Taro.setStorageSync(FAVORITES_KEY, newFavs)
  details = [...details, { ...recipe, savedAt: Date.now() }]
  Taro.setStorageSync(FAVORITE_DETAILS_KEY, details)
  return true
}

export const getFavoriteCount = (): number => getFavoriteIds().length

// ============ 搜索历史 ============
const MAX_HISTORY = 10

export interface SearchHistoryItem {
  keywords: string
  timestamp: number
}

export const getSearchHistory = (): SearchHistoryItem[] => {
  try {
    const history = Taro.getStorageSync(SEARCH_HISTORY_KEY)
    return Array.isArray(history) ? history : []
  } catch { return [] }
}

export const addSearchHistory = (keywords: string): void => {
  if (!keywords.trim()) return
  let history = getSearchHistory()
  history = history.filter(item => item.keywords !== keywords)
  history.unshift({ keywords: keywords.trim(), timestamp: Date.now() })
  if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY)
  Taro.setStorageSync(SEARCH_HISTORY_KEY, history)
}

export const clearSearchHistory = (): void => {
  Taro.removeStorageSync(SEARCH_HISTORY_KEY)
}

export const deleteSearchHistory = (index: number): void => {
  const history = getSearchHistory()
  history.splice(index, 1)
  Taro.setStorageSync(SEARCH_HISTORY_KEY, history)
}

// ============ 做过的菜 ============
export const markAsCooked = (recipe: Recipe): void => {
  try {
    const cooked = getCookedRecipes()
    if (!cooked.find(c => c.id === recipe.id)) {
      cooked.unshift({ ...recipe, cookedAt: Date.now() })
      if (cooked.length > 20) cooked.pop()
      Taro.setStorageSync(COOKED_RECIPES_KEY, cooked)
    }
  } catch (e) { console.error('Mark as cooked failed:', e) }
}

export const getCookedRecipes = (): (Recipe & { cookedAt: number })[] => {
  try {
    const cooked = Taro.getStorageSync(COOKED_RECIPES_KEY)
    return Array.isArray(cooked) ? cooked : []
  } catch { return [] }
}

// ============ 缓存相关 ============
const RECIPE_CACHE_KEY = 'recipeCache'
const CACHE_EXPIRE = 24 * 60 * 60 * 1000 // 24小时
const MAX_CACHE_SIZE = 50 // 最多缓存50条

interface CacheItem {
  data: Recipe | Recipe[]
  timestamp: number
}

export const getCachedRecipe = (key: string): Recipe | Recipe[] | null => {
  try {
    const cache = Taro.getStorageSync(RECIPE_CACHE_KEY) as Record<string, CacheItem> | null
    if (!cache || !cache[key]) return null
    const item = cache[key]
    if (Date.now() - item.timestamp > CACHE_EXPIRE) {
      delete cache[key]
      Taro.setStorageSync(RECIPE_CACHE_KEY, cache)
      return null
    }
    return item.data
  } catch { return null }
}

export const setCachedRecipe = (key: string, data: Recipe | Recipe[]): void => {
  try {
    let cache = (Taro.getStorageSync(RECIPE_CACHE_KEY) as Record<string, CacheItem>) || {}
    
    // 超过容量限制时，删除最老的缓存
    if (Object.keys(cache).length >= MAX_CACHE_SIZE) {
      const sorted = Object.entries(cache).sort((a, b) => a[1].timestamp - b[1].timestamp)
      const toDelete = sorted.slice(0, Math.floor(MAX_CACHE_SIZE / 2))
      toDelete.forEach(([k]) => delete cache[k])
    }
    
    cache[key] = { data, timestamp: Date.now() }
    Taro.setStorageSync(RECIPE_CACHE_KEY, cache)
  } catch (e) { console.error('Cache set failed:', e) }
}

export const removeCachedRecipe = (key: string): void => {
  try {
    const cache = (Taro.getStorageSync(RECIPE_CACHE_KEY) as Record<string, CacheItem>) || {}
    if (!cache[key]) return
    delete cache[key]
    Taro.setStorageSync(RECIPE_CACHE_KEY, cache)
  } catch (e) { console.error('Cache remove failed:', e) }
}

export const generateCacheKey = (ingredients: string[], scene?: string): string => {
  const sorted = [...ingredients].sort().join(',')
  return scene ? `${scene}:${sorted}` : sorted
}
