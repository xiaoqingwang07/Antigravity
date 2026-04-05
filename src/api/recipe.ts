/**
 * 统一 API 层：场景 + 就餐人数 + 单一 JSON 协议
 * LLM：MiniMax OpenAI 兼容接口（默认模型 MiniMax-M2.7）
 * 国内接入点见官方文档：https://platform.minimaxi.com/docs/guides/text-ai-coding-tools
 */
import Taro from '@tarojs/taro'
import type { Recipe, SceneType } from '../types/recipe'
import { enrichRecipeMedia } from '../utils/enrichRecipeMedia'

/** OpenAI 兼容 Base URL（中国大陆：api.minimaxi.com，勿使用 api.minimax.io） */
const API_BASE_URL = 'https://api.minimaxi.com/v1'
const DEFAULT_MODEL = 'MiniMax-M2.7'

const SCENE_STORAGE = 'recipeScene'

export function getStoredScene(): SceneType {
  const s = Taro.getStorageSync(SCENE_STORAGE) as SceneType | ''
  if (s === 'runner' || s === 'quick' || s === 'muscle' || s === 'normal') return s
  return 'normal'
}

export function setStoredScene(scene: SceneType): void {
  Taro.setStorageSync(SCENE_STORAGE, scene)
}

function getDiners(): number {
  const n = Number(Taro.getStorageSync('defaultDinersCount'))
  if (Number.isFinite(n) && n >= 1 && n <= 10) return n
  return 2
}

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

export interface FetchRecipesOptions extends RequestConfig {
  scene?: SceneType
  /** 不传则从本地 defaultDinersCount 读取 */
  diners?: number
}

const DEFAULT_CONFIG: RequestConfig = { retry: 2, timeout: 60000 }

const LLM_STORAGE_KEYS = ['LLM_API_KEY', 'DEEPSEEK_API_KEY'] as const

/**
 * 优先「我的」里保存的 Key；否则 .env.local / 环境变量注入的 TARO_APP_MINIMAX_API_KEY（其次兼容 TARO_APP_DEEPSEEK_API_KEY 占位读取，接口仍为 MiniMax）。
 */
export function getLlmApiKey(): string {
  try {
    for (const k of LLM_STORAGE_KEYS) {
      const v = Taro.getStorageSync(k)
      if (v != null && String(v).trim() !== '') return String(v).trim()
    }
  } catch { /* storage unavailable */ }
  if (typeof TARO_APP_MINIMAX_API_KEY === 'string' && TARO_APP_MINIMAX_API_KEY.trim() !== '') {
    return TARO_APP_MINIMAX_API_KEY.trim()
  }
  if (typeof TARO_APP_DEEPSEEK_API_KEY === 'string' && TARO_APP_DEEPSEEK_API_KEY.trim() !== '') {
    return TARO_APP_DEEPSEEK_API_KEY.trim()
  }
  return ''
}

/** @deprecated 使用 getLlmApiKey；保留别名避免大范围改名 */
export const getDeepseekApiKey = getLlmApiKey

const getApiKey = getLlmApiKey

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
      if (e instanceof APIError && (e.type === APIErrorType.INVALID_KEY || e.type === APIErrorType.NO_API_KEY)) {
        throw e
      }
      if (i < retries) await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw lastError
}

const JSON_SCHEMA = `必须返回纯 JSON 数组，不要 Markdown、不要解释文字。结构示例：
[{ "title": "菜名", "quote": "一句话点评", "rating": 4.8, "count": 1024, "emoji": "🥘", "image": "可选 HTTPS 成品图 URL", "ingredients": [{"name": "食材1", "amount": "用量"}], "steps": [{"content": "步骤1", "time": 10, "tip": "可选", "image": "可选 HTTPS 步骤图 URL"}], "nutritionAnalysis": "营养要点", "time": 20, "difficulty": "简单" }]
image 与 steps[].image 可省略；省略时客户端会用图库兜底。`

const SCENE_BLOCKS: Record<SceneType, string> = {
  normal: `你是专业中餐与家庭营养主厨。
要求：营养均衡、做法家常、用料贴近中国家庭厨房。`,
  runner: `用户刚完成跑步训练，需要跑后恢复餐。
要求：优先补充糖原与优质蛋白（可参考约 3:1 碳水蛋白比思路）、易消化、避免过于油腻；步骤切实可行。`,
  quick: `用户时间紧张，需要快手菜。
要求：总耗时尽量控制在 15 分钟内、步骤不超过 5 步、调料常见。`,
  muscle: `用户目标是增肌与力量训练饮食。
要求：高蛋白、烹饪方式简单（蒸/煮/快炒为主），份量说明要合理。`,
}

const SCENE_USER_TAIL: Record<SceneType, string> = {
  normal: '请推荐家常菜。',
  runner: '请推荐适合跑后补充能量的菜。',
  quick: '请推荐快手菜。',
  muscle: '请推荐高蛋白增肌餐。',
}

const DEFAULT_TAGS: Record<SceneType, string[]> = {
  normal: ['家常'],
  runner: ['跑后恢复'],
  quick: ['快手'],
  muscle: ['高蛋白'],
}

export const fetchRecipes = async (
  ingredients: string[],
  count: number = 3,
  config?: FetchRecipesOptions
): Promise<Recipe[]> => {
  const apiKey = getApiKey()
  if (!apiKey) throw new APIError('请先在设置中添加 MiniMax API Key，或在 .env.local 配置 TARO_APP_MINIMAX_API_KEY', APIErrorType.NO_API_KEY)

  const scene: SceneType = config?.scene ?? getStoredScene()
  const diners = config?.diners ?? getDiners()

  const systemPrompt = `${SCENE_BLOCKS[scene]}

${JSON_SCHEMA}
共返回 ${count} 道菜；每道菜的 ingredients 与 steps 必须完整、可执行。`

  const userContent = `食材（用户现有）：${ingredients.join('、')}。
就餐人数：${diners} 人（请按人数调整用料用量描述）。
${SCENE_USER_TAIL[scene]}
请推荐 ${count} 道菜。`

  return requestWithRetry(async () => {
    const response = await Taro.request({
      url: `${API_BASE_URL}/chat/completions`,
      method: 'POST',
      header: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      data: {
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: 0.75,
        max_tokens: 2800
      },
      timeout: config?.timeout || DEFAULT_CONFIG.timeout
    })

    if (response.statusCode !== 200) {
      const d = response.data as Record<string, unknown> | undefined
      const errObj = d?.error as { message?: string } | undefined
      const msg =
        errObj?.message ||
        (typeof d?.message === 'string' ? d.message : undefined) ||
        (typeof d?.msg === 'string' ? d.msg : undefined)
      throw parseError(response.statusCode, msg)
    }

    const content = response.data.choices?.[0]?.message?.content
    if (!content) throw new APIError('AI 返回为空', APIErrorType.PARSE_ERROR)

    const data = safeParseJSON(content) as Recipe[]
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new APIError('无法解析菜谱数据', APIErrorType.PARSE_ERROR)
    }

    const tags = DEFAULT_TAGS[scene]
    const batchId = Date.now()
    return data.map((r, idx) => {
      const stableId =
        r.id != null && String(r.id).trim() !== ''
          ? String(r.id)
          : `ai-${batchId}-${idx}-${Math.random().toString(36).slice(2, 8)}`
      return enrichRecipeMedia({
        ...r,
        id: stableId,
        isFavorite: false,
        source: 'ai' as const,
        time: r.time || 20,
        difficulty: r.difficulty || '中等',
        tags: r.tags?.length ? r.tags : tags,
        steps: r.steps?.map((s: any) => (typeof s === 'string' ? { content: s } : s)) || []
      })
    })
  }, config?.retry ?? DEFAULT_CONFIG.retry!)
}

export const checkApiKey = async (): Promise<{ valid: boolean; error?: string }> => {
  const apiKey = getApiKey()
  if (!apiKey) return { valid: false, error: '请先设置 API Key' }
  try {
    const response = await Taro.request({
      url: `${API_BASE_URL}/chat/completions`,
      method: 'POST',
      header: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      data: { model: DEFAULT_MODEL, messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
      timeout: 15000
    })
    if (response.statusCode === 200) return { valid: true }
    if (response.statusCode === 401 || response.statusCode === 403) {
      return { valid: false, error: 'API Key 无效' }
    }
    const d = response.data as Record<string, unknown> | undefined
    const errObj = d?.error as { message?: string } | undefined
    const hint = errObj?.message || (typeof d?.message === 'string' ? d.message : '')
    return { valid: false, error: hint ? `${response.statusCode}: ${hint}` : `错误: ${response.statusCode}` }
  } catch (e: any) {
    return { valid: false, error: e.message || '网络错误' }
  }
}

/** 兼容旧调用：单场景单道，内部走统一 fetchRecipes */
export const fetchRecipesByScene = async (
  ingredients: string[],
  scene: SceneType = 'normal',
  config?: FetchRecipesOptions
): Promise<Recipe[]> => {
  return fetchRecipes(ingredients, 1, { ...config, scene })
}
