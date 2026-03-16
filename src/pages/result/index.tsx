import { View, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect, useState, useMemo } from 'react'
import { DEFAULT_RECIPES } from '../../data/recipes'
import { fetchRecipes } from '../../api/recipe'
import { getFavoriteIds, toggleFavorite, generateCacheKey, getCachedRecipe, setCachedRecipe } from '../../store'
import type { Recipe } from '../../types/recipe'

export default function Result() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const router = useRouter()

  // 检查是否已收藏
  const checkFavorite = (recipeId: number | string): boolean => {
    return getFavoriteIds().includes(Number(recipeId))
  }

  useEffect(() => {
    const { auto, ingredients, from } = router.params
    const decodedIngredients = ingredients ? decodeURIComponent(ingredients) : ''

    if (auto === 'true' && decodedIngredients) {
      fetchAI(decodedIngredients.split(/[,、]/))
    } else if (from === 'random') {
      fetchRandom()
    } else {
      // 加载默认推荐
      setRecipes(DEFAULT_RECIPES.slice(0, 6).map(r => ({
        ...r,
        isFavorite: checkFavorite(r.id)
      })))
    }
  }, [router.params])

  // AI 推荐（统一走 API 层）
  const fetchAI = async (ingredients: string[]) => {
    setIsLoading(true)
    setError('')

    // 先检查缓存
    const cacheKey = generateCacheKey(ingredients)
    const cached = getCachedRecipe(cacheKey) as Recipe[] | null
    if (cached) {
      setRecipes(cached.map(r => ({ ...r, isFavorite: checkFavorite(r.id) })))
      setIsLoading(false)
      return
    }

    try {
      const data = await fetchRecipes(ingredients, 3)
      
      // 缓存结果
      setCachedRecipe(cacheKey, data)
      
      setRecipes(data.map(r => ({ ...r, isFavorite: checkFavorite(r.id) })))
    } catch (err: any) {
      console.error('AI Error:', err)
      setError(err.message || 'AI 暂时繁忙，已为你推荐热门菜谱')
      setRecipes(DEFAULT_RECIPES.slice(0, 6).map(r => ({
        ...r,
        isFavorite: checkFavorite(r.id)
      })))
    } finally {
      setIsLoading(false)
    }
  }

  // 随机推荐
  const fetchRandom = () => {
    const shuffled = [...DEFAULT_RECIPES].sort(() => Math.random() - 0.5).slice(0, 6)
    setRecipes(shuffled.map(r => ({
      ...r,
      isFavorite: checkFavorite(r.id)
    })))
  }

  // 切换收藏
  const handleToggleFavorite = (recipe: Recipe) => {
    if (!recipe.id) return
    const isFav = toggleFavorite(recipe)
    setRecipes(prev => prev.map(r => 
      r.id === recipe.id ? { ...r, isFavorite: isFav } : r
    ))
    Taro.showToast({ 
      title: isFav ? '收藏成功 ❤️' : '已取消收藏', 
      icon: 'none' 
    })
  }

  const goToDetail = (item: Recipe) => {
    Taro.setStorageSync('selectedRecipeDetail', item)
    Taro.navigateTo({ url: '/pages/detail/index' })
  }

  // ============ Styles ============
  const S = useMemo(() => ({
    page: {
      minHeight: '100vh',
      backgroundColor: '#fafafa',
      padding: '20px',
      paddingBottom: '40px'
    } as React.CSSProperties,
    header: { marginBottom: '20px' } as React.CSSProperties,
    title: { fontSize: '22px', fontWeight: '700', color: '#1a1a2e', marginBottom: '4px' } as React.CSSProperties,
    subtitle: { fontSize: '14px', color: '#8e8e93' } as React.CSSProperties,
    errorBox: { backgroundColor: '#fff7ed', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', borderLeft: '3px solid #ff9a56' } as React.CSSProperties,
    errorText: { fontSize: '14px', color: '#ea580c' } as React.CSSProperties,
    listContainer: { display: 'flex', flexDirection: 'column', gap: '14px' } as React.CSSProperties,
    card: { backgroundColor: '#ffffff', borderRadius: '18px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)' } as React.CSSProperties,
    imgBox: { width: '72px', height: '72px', backgroundColor: '#fff7ed', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', flexShrink: 0 } as React.CSSProperties,
    infoBox: { flex: 1, minWidth: 0 } as React.CSSProperties,
    cardTitle: { fontSize: '16px', fontWeight: '600', color: '#1a1a2e', marginBottom: '4px' } as React.CSSProperties,
    quote: { fontSize: '13px', color: '#ff9a56', fontStyle: 'italic', marginBottom: '8px' } as React.CSSProperties,
    metaRow: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' as const } as React.CSSProperties,
    ratingBadge: { display: 'flex', alignItems: 'center', gap: '3px', backgroundColor: '#fffbeb', padding: '2px 8px', borderRadius: '6px' } as React.CSSProperties,
    star: { fontSize: '12px', color: '#fbbf24' } as React.CSSProperties,
    rateVal: { fontSize: '12px', fontWeight: '600', color: '#d97706' } as React.CSSProperties,
    countText: { fontSize: '12px', color: '#aeaeb2' } as React.CSSProperties,
    timeTag: { fontSize: '12px', color: '#8e8e93', backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '4px' } as React.CSSProperties,
    favBtn: { padding: '8px', fontSize: '20px', backgroundColor: 'transparent', border: 'none', lineHeight: 1 } as React.CSSProperties,
    loadingBox: { height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' } as React.CSSProperties,
    loadingEmoji: { fontSize: '48px', marginBottom: '16px' } as React.CSSProperties,
    loadingText: { color: '#8e8e93', fontSize: '15px', fontWeight: '500' } as React.CSSProperties
  }), [])

  if (isLoading) {
    return (
      <View style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <View style={S.loadingBox}>
          <Text style={S.loadingEmoji}>👨🍳</Text>
          <Text style={S.loadingText}>AI 主厨正在定制菜谱...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={S.page}>
      <View style={S.header}>
        <Text style={S.title}>为你推荐</Text>
        <Text style={S.subtitle}>{recipes.length} 道适合你的美味</Text>
      </View>

      {error && (
        <View style={S.errorBox}>
          <Text style={S.errorText}>{error}</Text>
        </View>
      )}

      <View style={S.listContainer}>
        {recipes.map((item, idx) => (
          <View 
            key={item.id || idx} 
            style={S.card}
            onClick={() => goToDetail(item)}
          >
            <View style={S.imgBox}>
              <Text>{item.emoji || '🥘'}</Text>
            </View>
            <View style={S.infoBox}>
              <Text style={S.cardTitle}>{item.title}</Text>
              {item.quote && <Text style={S.quote}>"{item.quote}"</Text>}
              <View style={S.metaRow}>
                {item.rating && (
                  <View style={S.ratingBadge}>
                    <Text style={S.star}>★</Text>
                    <Text style={S.rateVal}>{item.rating}</Text>
                  </View>
                )}
                <Text style={S.countText}>{item.count ? `${item.count}人做过` : '新品'}</Text>
                {item.time && <Text style={S.timeTag}>{item.time}分钟</Text>}
              </View>
            </View>
            <View style={S.favBtn} onClick={(e) => { e.stopPropagation(); handleToggleFavorite(item) }}>
              <Text>{item.isFavorite ? '❤️' : '🤍'}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}
