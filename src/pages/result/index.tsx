import { View, Text, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState, useMemo, useRef, type CSSProperties } from 'react'
import { DEFAULT_RECIPES } from '../../data/recipes'
import { fetchRecipes, getStoredScene } from '../../api/recipe'
import { getFavoriteIds, toggleFavorite, generateCacheKey, getCachedRecipe, setCachedRecipe, removeCachedRecipe } from '../../store'
import { matchRecipesSimple } from '../../utils/recipeMatch'
import { shuffleWithSeed, daySeed } from '../../utils/shuffleSeed'
import { D } from '../../theme/designTokens'
import { enrichRecipeMedia } from '../../utils/enrichRecipeMedia'
import type { Recipe, SceneType } from '../../types/recipe'

function parseScene(s: string | undefined): SceneType {
  if (s === 'runner' || s === 'quick' || s === 'muscle' || s === 'normal') return s
  return getStoredScene()
}

const SOURCE_LABEL: Record<string, string> = {
  ai: 'AI',
  cache: '缓存',
  local: '本地',
}

export default function Result() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [reloadTick, setReloadTick] = useState(0)
  const skipCacheOnceRef = useRef(false)
  const router = useRouter()

  const checkFavorite = (recipeId: number | string): boolean => {
    return getFavoriteIds().includes(String(recipeId))
  }

  useEffect(() => {
    let cancelled = false

    setIsLoading(false)
    setError('')

    const safeSetError = (msg: string) => {
      if (cancelled) return
      setError(msg)
    }
    const safeSetLoading = (v: boolean) => {
      if (cancelled) return
      setIsLoading(v)
    }

    const fetchAI = async (ingredients: string[], scene: SceneType, bypassCache: boolean) => {
      if (cancelled) return
      safeSetLoading(true)
      safeSetError('')

      const cacheKey = generateCacheKey(ingredients, scene)
      const cached = !bypassCache ? (getCachedRecipe(cacheKey) as Recipe[] | null) : null
      if (cached) {
        if (cancelled) return
        setRecipes(
          cached.map((r) => ({
            ...r,
            source: 'cache' as const,
            isFavorite: checkFavorite(r.id),
          }))
        )
        safeSetLoading(false)
        return
      }

      try {
        const data = await fetchRecipes(ingredients, 3, { scene })
        if (cancelled) return
        setCachedRecipe(cacheKey, data)
        setRecipes(
          data.map((r) => ({
            ...r,
            source: 'ai' as const,
            isFavorite: checkFavorite(r.id),
          }))
        )
      } catch (err: any) {
        if (cancelled) return
        console.error('AI Error:', err)
        setError(err.message || '网络异常，已展示本地热门菜谱')
        const seed = daySeed()
        const shuffled = shuffleWithSeed([...DEFAULT_RECIPES], seed).slice(0, 6)
        setRecipes(
          shuffled.map((r) => ({
            ...r,
            source: 'local' as const,
            isFavorite: checkFavorite(r.id),
          }))
        )
      } finally {
        safeSetLoading(false)
      }
    }

    const { auto, ingredients, from, id: presetId, scene: sceneParam } = router.params
    const decodedIngredients = ingredients ? decodeURIComponent(ingredients) : ''
    const scene = parseScene(sceneParam)

    if (from === 'pantry' && decodedIngredients) {
      const list = decodedIngredients.split(/[,、]/).filter(Boolean)
      const matched = matchRecipesSimple(list, 6)
      if (cancelled) return
      if (matched.length > 0) {
        setRecipes(
          matched.map((r) => ({
            ...r,
            source: 'local' as const,
            isFavorite: checkFavorite(r.id),
          }))
        )
      } else {
        setError('本地库暂无匹配，正在尝试 AI…')
        void fetchAI(list, scene, false)
      }
    } else if ((from === 'ai' || auto === 'true') && decodedIngredients) {
      const skip = skipCacheOnceRef.current
      skipCacheOnceRef.current = false
      void fetchAI(decodedIngredients.split(/[,、]/).filter(Boolean), scene, skip)
    } else if (from === 'random') {
      if (cancelled) return
      const shuffled = shuffleWithSeed([...DEFAULT_RECIPES], daySeed()).slice(0, 6)
      setRecipes(
        shuffled.map((r) => ({
          ...r,
          source: 'local' as const,
          isFavorite: checkFavorite(r.id),
        }))
      )
    } else if (from === 'preset' && presetId) {
      if (cancelled) return
      const recipe = DEFAULT_RECIPES.find((r) => String(r.id) === String(presetId))
      if (recipe) {
        setRecipes([
          {
            ...recipe,
            source: 'local' as const,
            isFavorite: checkFavorite(recipe.id),
          },
        ])
      } else {
        setError('未找到该菜谱')
        setRecipes([])
      }
    } else {
      if (cancelled) return
      const shuffled = shuffleWithSeed([...DEFAULT_RECIPES], daySeed()).slice(0, 6)
      setRecipes(
        shuffled.map((r) => ({
          ...r,
          source: 'local' as const,
          isFavorite: checkFavorite(r.id),
        }))
      )
    }

    return () => {
      cancelled = true
    }
  }, [router.params, reloadTick])

  const handleToggleFavorite = (recipe: Recipe) => {
    if (!recipe.id) return
    const isFav = toggleFavorite(recipe)
    setRecipes((prev) =>
      prev.map((r) => (String(r.id) === String(recipe.id) ? { ...r, isFavorite: isFav } : r))
    )
    Taro.showToast({
      title: isFav ? '已收藏' : '已取消',
      icon: 'none',
    })
  }

  const goToDetail = (item: Recipe) => {
    Taro.setStorageSync('selectedRecipeDetail', item)
    Taro.navigateTo({ url: '/pages/detail/index' })
  }

  const aiIngredientsList = router.params.ingredients
    ? decodeURIComponent(router.params.ingredients).split(/[,、]/).filter(Boolean)
    : []
  const aiScene = parseScene(router.params.scene)
  const showAiRegen =
    (router.params.from === 'ai' || router.params.auto === 'true') && aiIngredientsList.length > 0

  const handleRegenerateAi = () => {
    const key = generateCacheKey(aiIngredientsList, aiScene)
    removeCachedRecipe(key)
    skipCacheOnceRef.current = true
    setReloadTick((t) => t + 1)
    Taro.showToast({ title: '正在重新生成…', icon: 'none' })
  }

  const S = useMemo(
    () => ({
      page: {
        minHeight: '100vh',
        backgroundColor: D.bg,
        padding: `${D.pagePadTop}px ${D.pagePadH}px 40px`,
      } as CSSProperties,
      header: { marginBottom: 22 } as CSSProperties,
      title: {
        fontSize: D.titleLarge,
        fontWeight: '700',
        color: D.label,
        marginBottom: 6,
        letterSpacing: '-0.03em',
      } as CSSProperties,
      subtitle: { fontSize: D.footnote, color: D.labelSecondary } as CSSProperties,
      errorBox: {
        backgroundColor: D.bgElevated,
        borderRadius: D.radiusM,
        padding: '14px 16px',
        marginBottom: 18,
        border: `0.5px solid ${D.separator}`,
      } as CSSProperties,
      errorText: { fontSize: D.footnote, color: D.accentWarm, lineHeight: 1.45 } as CSSProperties,
      listContainer: { display: 'flex', flexDirection: 'column', gap: 12 } as CSSProperties,
      card: {
        backgroundColor: D.bgElevated,
        borderRadius: D.radiusL,
        padding: '18px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        border: `0.5px solid ${D.separatorLight}`,
        boxShadow: D.shadowCard,
      } as CSSProperties,
      imgBox: {
        width: 92,
        height: 92,
        backgroundColor: D.bg,
        borderRadius: D.radiusS,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 34,
        flexShrink: 0,
        overflow: 'hidden',
      } as CSSProperties,
      infoBox: { flex: 1, minWidth: 0 } as CSSProperties,
      cardTitle: {
        fontSize: D.body,
        fontWeight: '600',
        color: D.label,
        marginBottom: 4,
      } as CSSProperties,
      quote: {
        fontSize: D.caption,
        color: D.labelSecondary,
        marginBottom: 8,
        lineHeight: 1.4,
      } as CSSProperties,
      metaRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap' as const,
      } as CSSProperties,
      badge: {
        fontSize: 11,
        fontWeight: '600',
        color: D.accent,
        backgroundColor: D.accentMuted,
        padding: '3px 8px',
        borderRadius: 6,
      } as CSSProperties,
      badgeAi: {
        fontSize: 11,
        fontWeight: '600',
        color: D.green,
        backgroundColor: 'rgba(74, 124, 106, 0.14)',
        padding: '3px 8px',
        borderRadius: 6,
      } as CSSProperties,
      badgeCache: {
        fontSize: 11,
        fontWeight: '600',
        color: D.blue,
        backgroundColor: 'rgba(90, 101, 112, 0.12)',
        padding: '3px 8px',
        borderRadius: 6,
      } as CSSProperties,
      timeTag: {
        fontSize: D.caption,
        color: D.labelTertiary,
        backgroundColor: D.bg,
        padding: '3px 8px',
        borderRadius: 6,
      } as CSSProperties,
      favBtn: {
        padding: 10,
        fontSize: 22,
        backgroundColor: 'transparent',
        border: 'none',
        lineHeight: 1,
      } as CSSProperties,
      loadingBox: {
        height: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      } as CSSProperties,
      loadingEmoji: { fontSize: 48, marginBottom: 16 } as CSSProperties,
      loadingText: { color: D.labelSecondary, fontSize: D.body, fontWeight: '500' } as CSSProperties,
    }),
    []
  )

  if (isLoading) {
    return (
      <View style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <View style={S.loadingBox}>
          <Text style={S.loadingEmoji}>🍳</Text>
          <Text style={S.loadingText}>正在生成菜谱…</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={S.page}>
      <View style={S.header}>
        <Text style={S.title}>推荐</Text>
        <Text style={S.subtitle}>
          {recipes.length} 道 · 角标为来源 · 左侧为菜谱封面（步骤图见详情，与文案可能仅为氛围参考）
        </Text>
        {showAiRegen ? (
          <Text
            style={{ fontSize: 12, color: D.blue, fontWeight: '600', marginTop: 10 }}
            onClick={handleRegenerateAi}
          >
            忽略缓存，重新生成
          </Text>
        ) : null}
      </View>

      {error ? (
        <View style={S.errorBox}>
          <Text style={S.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={S.listContainer}>
        {recipes.map((item, idx) => {
          const r = enrichRecipeMedia(item)
          const badgeSt =
            r.source === 'ai' ? S.badgeAi : r.source === 'cache' ? S.badgeCache : S.badge
          return (
          <View key={r.id || idx} style={S.card} onClick={() => goToDetail(r)}>
            <View style={S.imgBox}>
              {r.image ? (
                <Image
                  src={r.image}
                  mode="aspectFill"
                  style={{ width: '100%', height: '100%', display: 'block' }}
                  lazyLoad
                />
              ) : (
                <Text>{r.emoji || '🥘'}</Text>
              )}
            </View>
            <View style={S.infoBox}>
              <Text style={S.cardTitle}>{r.title}</Text>
              {r.quote ? (
                <Text style={S.quote} numberOfLines={2}>
                  {r.quote}
                </Text>
              ) : null}
              <View style={S.metaRow}>
                {r.source ? (
                  <Text style={badgeSt}>{SOURCE_LABEL[r.source] || r.source}</Text>
                ) : null}
                {r.time ? <Text style={S.timeTag}>{r.time} 分钟</Text> : null}
              </View>
            </View>
            <View
              style={S.favBtn}
              onClick={(e) => {
                e.stopPropagation()
                handleToggleFavorite(r)
              }}
            >
              <Text>{r.isFavorite ? '♥' : '♡'}</Text>
            </View>
          </View>
          )
        })}
      </View>
    </View>
  )
}
