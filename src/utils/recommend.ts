import { DEFAULT_RECIPES } from '../data/recipes'
import { getMockWeather, type WeatherData } from '../api/weather'
import type { Recipe } from '../types/recipe'
import { shuffleWithSeed, daySeed } from './shuffleSeed'

export interface RecommendResult {
  recipes: Recipe[]
  reason: string
  weather: WeatherData
}

const HOT_SOUP_KEYWORDS = ['汤', '炖', '煲', '红烧', '蒸']
const COLD_DISH_KEYWORDS = ['沙拉', '凉', '冰']
const QUICK_KEYWORDS = ['快手', '简单']

function scoreRecipe(recipe: Recipe, weather: WeatherData): number {
  let score = 0
  const title = recipe.title
  const tags = (recipe.tags || []).join(' ')
  const combined = title + tags

  if (weather.temperature <= 10 || weather.condition === 'rainy' || weather.condition === 'snowy') {
    if (HOT_SOUP_KEYWORDS.some((k) => combined.includes(k))) score += 3
    if (recipe.time && recipe.time >= 20) score += 1
  }

  if (weather.temperature >= 28 || weather.condition === 'hot') {
    if (COLD_DISH_KEYWORDS.some((k) => combined.includes(k))) score += 3
    if (recipe.time && recipe.time <= 15) score += 2
    if (QUICK_KEYWORDS.some((k) => combined.includes(k))) score += 1
  }

  if (weather.condition === 'sunny' && weather.temperature >= 15 && weather.temperature < 28) {
    score += (recipe.time && recipe.time <= 25 ? 1 : 0) + (recipe.rating || 4) * 0.15
  }

  score += (recipe.rating || 4) * 0.5

  return score
}

/** 与天气联动的推荐语（首屏一句话） */
export function getReasonText(weather: WeatherData): string {
  if (weather.description && weather.city !== '上海') {
    return weather.description
  }
  if (weather.temperature <= 10 || weather.condition === 'rainy' || weather.condition === 'snowy') {
    return `${weather.city} ${weather.description}，来碗暖胃的吧`
  }
  if (weather.temperature >= 28 || weather.condition === 'hot') {
    return `${weather.city} ${weather.temperature}°C，来点清爽的`
  }
  return `${weather.city} ${weather.description}，今天吃点好的`
}

function rankAll(weather: WeatherData): { recipe: Recipe; score: number }[] {
  const scored = DEFAULT_RECIPES.map((recipe) => ({
    recipe,
    score: scoreRecipe(recipe, weather),
  }))
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    const ra = a.recipe.rating || 0
    const rb = b.recipe.rating || 0
    if (rb !== ra) return rb - ra
    return String(a.recipe.title).localeCompare(String(b.recipe.title), 'zh-CN')
  })
  return scored
}

/**
 * @param topPool 先取评分前 N 道再在池内打乱，避免「换一批」全是冷门
 */
export function getWeatherRecommendationsForWeather(
  weather: WeatherData,
  total: number,
  variant: number = 0,
  topPool: number = 20
): RecommendResult {
  const ranked = rankAll(weather)
  const poolSize = Math.min(topPool, ranked.length)
  const head = ranked.slice(0, poolSize).map((x) => x.recipe)
  const seed = daySeed() + variant * 9973
  const shuffled = shuffleWithSeed([...head], seed)
  return {
    recipes: shuffled.slice(0, Math.min(total, shuffled.length)),
    reason: getReasonText(weather),
    weather,
  }
}

/** 兼容旧调用：mock 天气 + 默认 3 条 */
export function getWeatherRecommendations(count: number = 3): RecommendResult {
  return getWeatherRecommendationsForWeather(getMockWeather(), count, 0)
}
