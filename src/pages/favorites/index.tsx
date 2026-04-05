import { View, Text, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useCallback, useState } from 'react'
import { getFavoriteDetails, toggleFavorite } from '../../store'
import { getStoredScene } from '../../api/recipe'
import type { Recipe } from '../../types/recipe'
import { enrichRecipeMedia } from '../../utils/enrichRecipeMedia'
import { D } from '../../theme/designTokens'
import * as S from '../../styles/common'

export default function Favorites() {
  const [favorites, setFavorites] = useState<Recipe[]>([])
  const [isEmpty, setIsEmpty] = useState(true)

  const loadFavorites = useCallback(() => {
    const details = getFavoriteDetails()
    setFavorites(details)
    setIsEmpty(details.length === 0)
  }, [])

  useDidShow(() => {
    loadFavorites()
  })

  const removeFavorite = (recipe: Recipe) => {
    toggleFavorite(recipe)
    loadFavorites()
    Taro.showToast({ title: '已取消收藏', icon: 'none' })
  }

  const goToDetail = (item: Recipe) => {
    Taro.setStorageSync('selectedRecipeDetail', item)
    Taro.navigateTo({ url: '/pages/detail/index' })
  }

  return (
    <View style={S.pageStyle}>
      <View style={S.headerLargeStyle}>
        <Text style={S.titleLargeStyle}>我的收藏</Text>
      </View>

      {isEmpty ? (
        <View style={S.emptyStyle}>
          <Text style={S.emptyEmojiStyle}>⭐</Text>
          <Text style={S.emptyTitleStyle}>暂无收藏</Text>
          <Text style={{ ...S.emptyDescStyle, paddingLeft: 28, paddingRight: 28 }}>
            在推荐列表点「♡」即可收藏喜欢的菜谱
          </Text>
          <View style={{ marginTop: 28, width: '100%', paddingLeft: 40, paddingRight: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <View
              style={{
                height: 48,
                borderRadius: 999,
                backgroundColor: D.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() =>
                Taro.navigateTo({
                  url: `/pages/result/index?from=random&scene=${getStoredScene()}`,
                })
              }
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>去看推荐</Text>
            </View>
            <View
              style={{
                height: 48,
                borderRadius: 999,
                border: `0.5px solid ${D.separator}`,
                backgroundColor: D.bgElevated,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => Taro.switchTab({ url: '/pages/index/index' })}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: D.label }}>回首页</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={S.listStyle}>
          {favorites.map((item: Recipe, idx: number) => {
            const r = enrichRecipeMedia(item)
            return (
            <View 
              key={r.id || idx} 
              style={S.cardRowStyle}
              onClick={() => goToDetail(r)}
            >
              <View style={S.emojiBoxSmallStyle}>
                {r.image ? (
                  <Image src={r.image} mode="aspectFill" style={{ width: '100%', height: '100%', display: 'block' }} lazyLoad />
                ) : (
                  <Text>{r.emoji || '🥘'}</Text>
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={S.titleStyle}>{r.title}</Text>
                <Text style={S.textMutedStyle} numberOfLines={1}>{r.quote || r.nutritionAnalysis || '点击查看详情'}</Text>
              </View>
              <View
                onClick={(e) => {
                  e.stopPropagation()
                  removeFavorite(r)
                }}
                style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}
              >
                <Text style={{ fontSize: 18 }}>♥</Text>
                <Text style={{ fontSize: 10, color: D.labelTertiary, fontWeight: '600' }}>取消收藏</Text>
              </View>
            </View>
            )
          })}
        </View>
      )}
    </View>
  )
}
