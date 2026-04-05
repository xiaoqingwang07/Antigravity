/**
 * LLM 返回菜谱的 Zod 校验：防止模型抽风导致白屏或脏数据。
 * 校验失败由调用方走缓存 / 本地 fallback。
 */
import { z } from 'zod'

const ingredientSchema = z
  .object({
    name: z.string().min(1).max(200),
    amount: z.union([z.string(), z.number()]).optional(),
  })
  .transform((row) => ({
    name: row.name.trim(),
    amount: row.amount != null && String(row.amount).trim() !== '' ? String(row.amount).trim().slice(0, 100) : '适量',
  }))

const stepSchema = z.union([
  z.string().min(1).transform((content) => ({ content: content.trim() })),
  z.object({
    content: z.string().min(1),
    time: z.number().optional(),
    tip: z.string().optional(),
    image: z.string().optional(),
  }),
])

export const recipeLlmItemSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  title: z.string().min(1).max(200),
  quote: z.string().optional(),
  rating: z.number().optional(),
  count: z.number().optional(),
  emoji: z.string().optional(),
  image: z.string().optional(),
  ingredients: z.array(ingredientSchema).min(1),
  steps: z.array(stepSchema).min(1),
  nutritionAnalysis: z.string().optional(),
  time: z.number().positive().max(999).optional(),
  difficulty: z.string().max(20).optional(),
  tags: z.array(z.string()).optional(),
})

export type ParsedLlmRecipe = z.infer<typeof recipeLlmItemSchema>

/** 从已 JSON.parse 的值中筛出通过校验的菜谱项（静默丢弃坏项） */
export function parseLlmRecipeArray(raw: unknown): ParsedLlmRecipe[] {
  if (!Array.isArray(raw)) return []
  const out: ParsedLlmRecipe[] = []
  for (const el of raw) {
    const r = recipeLlmItemSchema.safeParse(el)
    if (r.success) out.push(r.data)
  }
  return out
}
