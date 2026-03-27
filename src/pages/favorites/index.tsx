import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useCallback, useState } from 'react'
import { getFavoriteDetails, toggleFavorite } from '../../store'
import type { Recipe } from '../../types/recipe'
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
          <Text style={S.emptyEmojiStyle}>💔</Text>
          <Text style={S.emptyTitleStyle}>还没有收藏</Text>
          <Text style={S.emptyDescStyle}>看到喜欢的菜谱就收藏起来吧~</Text>
        </View>
      ) : (
        <View style={S.listStyle}>
          {favorites.map((item: Recipe, idx: number) => (
            <View 
              key={item.id || idx} 
              style={S.cardRowStyle}
              onClick={() => goToDetail(item)}
            >
              <View style={S.emojiBoxSmallStyle}>
                <Text>{item.emoji || '🥘'}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={S.titleStyle}>{item.title}</Text>
                <Text style={S.textMutedStyle} numberOfLines={1}>{item.quote || item.nutritionAnalysis || '点击查看详情'}</Text>
              </View>
              <View 
                onClick={(e) => {
                  e.stopPropagation()
                  removeFavorite(item)
                }}
                style={{ padding: '8px', fontSize: '18px' }}
              >
                <Text>❤️</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
