/**
 * 统一 API 层
 */
import Taro from '@tarojs/taro'
import type { Recipe, SceneType } from '../types/recipe'

const API_BASE_URL = 'https://api.deepseek.com'
const DEFAULT_MODEL = 'deepseek-chat'

interface RequestConfig {
  retry?: number
  timeout?: number
}

const DEFAULT_CONFIG: RequestConfig = { retry: 2, timeout: 15000 }

const getApiKey = (): string => Taro.getStorageSync('DEEPSEEK_API_KEY') || ''

const safeParseJSON = (str: string): Recipe | Recipe[] | null => {
  try {
    const match = str.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
    if (match) return JSON.parse(match[0])
    return JSON.parse(str)
  } catch { return null }
}

const requestWithRetry = async <T>(fn: () => Promise<T>, retries: number = 2): Promise<T> => {
  let lastError: Error | null = null
  for (let i = 0; i <= retries; i++) {
    try { return await fn() }
    catch (e) {
      lastError = e as Error
      if (i < retries) await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw lastError
}

// 推荐多道菜谱
export const fetchRecipes = async (
  ingredients: string[],
  count: number = 3,
  config?: RequestConfig
): Promise<Recipe[]> => {
  const apiKey = getApiKey()
  if (!apiKey) throw new Error('请先在设置中添加 DeepSeek API Key')

  const systemPrompt = `你是一个五星级AI主厨和运动营养专家。请根据食材推荐 ${count} 道适合【跑步爱好者】的菜谱。
必须返回纯 JSON 数组格式。结构如下：
[{ "title": "菜名", "quote": "一句话点评", "rating": 4.8, "count": 1024, "emoji": "🥘", "ingredients": [{"name": "食材1", "amount": "用量"}], "steps": [{"content": "步骤1", "time": 10}], "nutritionAnalysis": "营养分析", "time": 20, "difficulty": "简单" }]
只返回 JSON，不要任何其他文字。`

  return requestWithRetry(async () => {
    const response = await Taro.request({
      url: `${API_BASE_URL}/chat/completions`,
      method: 'POST',
      header: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      data: {
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `食材：${ingredients.join('、')}。请推荐${count}道适合跑步后补充能量的菜。` }
        ],
        temperature: 1.0,
        max_tokens: 1500
      },
      timeout: config?.timeout || DEFAULT_CONFIG.timeout
    })

    if (response.statusCode !== 200) throw new Error(`API 错误: ${response.statusCode}`)
    const content = response.data.choices?.[0]?.message?.content
    if (!content) throw new Error('API 返回为空')

    const data = safeParseJSON(content) as Recipe[]
    if (!data || !Array.isArray(data) || data.length === 0) throw new Error('无法解析菜谱数据')

    return data.map((r, idx) => ({
      ...r,
      id: Number(r.id) || Date.now() + idx,
      isFavorite: false,
      time: r.time || 20,
      difficulty: r.difficulty || '中等',
      tags: r.tags || ['🏃 跑者专属'],
      steps: r.steps?.map((s: any) => typeof s === 'string' ? { content: s } : s) || []
    }))
  }, config?.retry || DEFAULT_CONFIG.retry!)
}

// 检查 API Key 是否有效
export const checkApiKey = async (): Promise<boolean> => {
  const apiKey = getApiKey()
  if (!apiKey) return false
  try {
    const response = await Taro.request({
      url: `${API_BASE_URL}/chat/completions`,
      method: 'POST',
      header: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      data: { model: DEFAULT_MODEL, messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
      timeout: 5000
    })
    return response.statusCode === 200
  } catch { return false }
}
