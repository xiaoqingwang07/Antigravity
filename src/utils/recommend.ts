import { DEFAULT_RECIPES } from '../data/recipes'
import { getMockWeather } from '../api/weather'
import type { Recipe } from '../types/recipe'
import type { WeatherData } from '../api/weather'

interface RecommendResult {
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
    if (HOT_SOUP_KEYWORDS.some(k => combined.includes(k))) score += 3
    if (recipe.time && recipe.time >= 20) score += 1
  }

  if (weather.temperature >= 28 || weather.condition === 'hot') {
    if (COLD_DISH_KEYWORDS.some(k => combined.includes(k))) score += 3
    if (recipe.time && recipe.time <= 15) score += 2
    if (QUICK_KEYWORDS.some(k => combined.includes(k))) score += 1
  }

  if (weather.condition === 'sunny' && weather.temperature >= 15 && weather.temperature < 28) {
    score += Math.random() * 2
  }

  score += (recipe.rating || 4) * 0.5
  score += Math.random() * 1.5

  return score
}

function getReasonText(weather: WeatherData): string {
  if (weather.temperature <= 10 || weather.condition === 'rainy' || weather.condition === 'snowy') {
    return `${weather.city} ${weather.description}，来碗暖胃的吧`
  }
  if (weather.temperature >= 28 || weather.condition === 'hot') {
    return `${weather.city} ${weather.temperature}°C，来点清爽的`
  }
  return `${weather.city} ${weather.description}，今天吃点好的`
}

export function getWeatherRecommendations(count: number = 3): RecommendResult {
  const weather = getMockWeather()
  const scored = DEFAULT_RECIPES.map(recipe => ({
    recipe,
    score: scoreRecipe(recipe, weather)
  }))
  scored.sort((a, b) => b.score - a.score)

  return {
    recipes: scored.slice(0, count).map(s => s.recipe),
    reason: getReasonText(weather),
    weather,
  }
}
