/**
 * 统一 API 层
 */
import Taro from '@tarojs/taro'
import type { Recipe, SceneType } from '../types/recipe'

const API_BASE_URL = 'https://api.deepseek.com'
const DEFAULT_MODEL = 'deepseek-chat'

// ============ 错误类型 ============
export enum APIErrorType {
  NO_API_KEY = 'NO_API_KEY',
  INVALID_KEY = 'INVALID_KEY',
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

export class APIError extends Error {
  constructor(
    message: string,
    public type: APIErrorType = APIErrorType.UNKNOWN,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'APIError'
  }
}

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

const parseError = (statusCode?: number, message?: string): APIError => {
  if (!statusCode) {
    return new APIError('网络连接失败，请检查网络', APIErrorType.NETWORK_ERROR)
  }
  
  if (statusCode === 401 || statusCode === 403) {
    return new APIError('API Key 无效，请检查设置', APIErrorType.INVALID_KEY, statusCode)
  }
  
  if (statusCode === 429) {
    return new APIError('请求太频繁，请稍后再试', APIErrorType.RATE_LIMIT, statusCode)
  }
  
  if (message?.includes('timeout')) {
    return new APIError('请求超时，请重试', APIErrorType.TIMEOUT, statusCode)
  }
  
  return new APIError(message || `请求失败 (${statusCode})`, APIErrorType.UNKNOWN, statusCode)
}

const requestWithRetry = async <T>(fn: () => Promise<T>, retries: number = 2): Promise<T> => {
  let lastError: Error | null = null
  for (let i = 0; i <= retries; i++) {
    try { return await fn() }
    catch (e: any) {
      lastError = e as Error
      // API Key 错误不重试
      if (e instanceof APIError && (e.type === APIErrorType.INVALID_KEY || e.type === APIErrorType.NO_API_KEY)) {
        throw e
      }
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
  if (!apiKey) throw new APIError('请先在设置中添加 DeepSeek API Key', APIErrorType.NO_API_KEY)

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

    if (response.statusCode !== 200) {
      throw parseError(response.statusCode, response.data?.error?.message)
    }
    
    const content = response.data.choices?.[0]?.message?.content
    if (!content) throw new APIError('AI 返回为空', APIErrorType.PARSE_ERROR)

    const data = safeParseJSON(content) as Recipe[]
    if (!data || !Array.isArray(data) || data.length === 0) throw new APIError('无法解析菜谱数据', APIErrorType.PARSE_ERROR)

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
export const checkApiKey = async (): Promise<{ valid: boolean; error?: string }> => {
  const apiKey = getApiKey()
  if (!apiKey) return { valid: false, error: '请先设置 API Key' }
  try {
    const response = await Taro.request({
      url: `${API_BASE_URL}/chat/completions`,
      method: 'POST',
      header: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      data: { model: DEFAULT_MODEL, messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
      timeout: 5000
    })
    if (response.statusCode === 200) return { valid: true }
    if (response.statusCode === 401 || response.statusCode === 403) {
      return { valid: false, error: 'API Key 无效' }
    }
    return { valid: false, error: `错误: ${response.statusCode}` }
  } catch (e: any) {
    return { valid: false, error: e.message || '网络错误' }
  }
}
