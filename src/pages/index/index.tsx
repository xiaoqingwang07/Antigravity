import { View, Text, Input, ScrollView } from '@tarojs/taro'
import { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import { DEFAULT_RECIPES } from '../../data/recipes'
import { getSearchHistory, addSearchHistory, clearSearchHistory } from '../../store'
import { fetchRecipes } from '../../api/recipe'
import type { Recipe } from '../../types/recipe'
import * as S from './styles'

export default function Index() {
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useDidShow(() => {
    const autoSearch = Taro.getStorageSync('autoSearchIngredient')
    if (autoSearch) {
      setInputValue(autoSearch)
      Taro.removeStorageSync('autoSearchIngredient')
    }
    loadSearchHistory()
  })

  const loadSearchHistory = () => {
    try {
      const history = getSearchHistory()
      setSearchHistory(history.map(h => h.keywords))
    } catch (e) { console.error('Load history failed:', e) }
  }

  const recommendedRecipes = DEFAULT_RECIPES.slice(0, 6)

  const handleGenerate = async () => {
    if (!inputValue.trim()) {
      Taro.showToast({ title: '先告诉我冰箱里有什么呀~', icon: 'none' })
      return
    }

    addSearchHistory(inputValue.trim())
    loadSearchHistory()
    setShowHistory(false)

    setIsLoading(true)
    Taro.showLoading({ title: 'AI 正在构思食谱...' })

    try {
      // 统一走 API 层
      const ingredients = inputValue.split(/[,、]/).filter(Boolean)
      const data = await fetchRecipes(ingredients, 1)
      
      if (data && data.length > 0) {
        Taro.setStorageSync('currentRecipe', data[0])
        Taro.hideLoading()
        Taro.navigateTo({ url: `/pages/result/index?from=ai&ingredients=${encodeURIComponent(inputValue)}` })
      } else {
        throw new Error('AI 返回为空')
      }
    } catch (error: any) {
      console.error('API Error:', error)
      Taro.hideLoading()
      const msg = error.message || 'AI 厨师可能累了，请重试'
      Taro.showModal({ title: '生成失败', content: msg, showCancel: false })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRandom = () => Taro.navigateTo({ url: '/pages/result/index?from=random' })
  const handleClearFridge = () => Taro.navigateTo({ url: '/pages/fridge/index' })
  const handleFavorites = () => Taro.switchTab({ url: '/pages/favorites/index' })

  const handleCardClick = (item: Recipe) => {
    Taro.setStorageSync('selectedRecipeDetail', item)
    Taro.navigateTo({ url: `/pages/result/index?from=preset&id=${item.id}` })
  }

  const handleHistoryClick = (keyword: string) => {
    setInputValue(keyword)
    setShowHistory(false)
  }

  const handleClearHistory = () => {
    clearSearchHistory()
    setSearchHistory([])
    Taro.showToast({ title: '已清空历史', icon: 'none' })
  }

  return (
    <View style={S.pageStyle}>
      <View style={S.headerStyle}>
        <Text style={S.greetingStyle}>你好 👋</Text>
        <Text style={S.subtitleStyle}>今天想吃点啥？</Text>
      </View>

      <View style={S.searchSectionStyle}>
        <View style={S.searchBarStyle}>
          <Text style={S.searchIconStyle}>🔍</Text>
          <Input 
            className='search-input' 
            placeholder='冰箱里有啥？' 
            placeholderStyle='color: #aeaeb2' 
            value={inputValue} 
            onInput={(e) => setInputValue(e.detail.value)} 
            onFocus={() => setShowHistory(true)} 
            onConfirm={handleGenerate} 
            disabled={isLoading} 
          />
          <View style={S.micBtnStyle} onClick={() => Taro.showToast({ title: '语音功能开发中~', icon: 'none' })}>
            <Text>🎤</Text>
          </View>
        </View>
      </View>

      {showHistory && searchHistory.length > 0 && (
        <View style={S.historyBoxStyle}>
          <View style={S.historyHeaderStyle}>
            <Text style={S.historyTitleStyle}>📜 最近搜索</Text>
            <Text style={S.clearBtnStyle} onClick={handleClearHistory}>清空</Text>
          </View>
          <View style={S.historyListStyle}>
            {searchHistory.slice(0, 8).map((keyword, idx) => (
              <View key={idx} style={S.historyTagStyle} onClick={() => handleHistoryClick(keyword)}>
                <Text>{keyword}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={S.runnerSectionStyle}>
        <View style={S.runnerCardStyle} onClick={() => Taro.showModal({ title: '🏃 黄金30分钟', content: '输入你冰箱里的食材，我帮你搭配最适合跑后恢复的餐！', confirmText: '好的', showCancel: false })}>
          <View style={S.runnerInfoStyle}>
            <View style={S.runnerTagStyle}><Text>🏃 跑者专属</Text></View>
            <Text style={S.runnerTitleStyle}>黄金30分钟</Text>
            <Text style={S.runnerDescStyle}>训练后补充 3:1 碳水蛋白比</Text>
          </View>
        </View>
      </View>

      <View style={S.recipesSectionStyle}>
        <View style={S.sectionHeaderStyle}>
          <Text style={S.sectionTitleStyle}>为你推荐</Text>
          <Text style={S.sectionMoreStyle} onClick={handleRandom}>换一批 →</Text>
        </View>
        <ScrollView scrollX={true} style={S.recipeScrollStyle} enableFlex showScrollbar={false}>
          <View style={S.recipeListStyle}>
            {recommendedRecipes.map((item) => (
              <View key={item.id} style={S.recipeCardStyle} onClick={() => handleCardClick(item)}>
                <View style={S.recipeEmojiBgStyle}><Text>{item.emoji}</Text></View>
                <Text style={S.recipeTitleStyle}>{item.title}</Text>
                <Text style={S.recipeTagStyle}>{item.time}分钟</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={S.actionsSectionStyle}>
        <View style={S.actionItemStyle} onClick={handleClearFridge}>
          <View style={S.actionEmojiStyle}><Text>📷</Text></View>
          <Text style={S.actionTextStyle}>清冰箱</Text>
        </View>
        <View style={S.actionItemStyle} onClick={handleRandom}>
          <View style={S.actionEmojiStyle}><Text>🎲</Text></View>
          <Text style={S.actionTextStyle}>随机</Text>
        </View>
        <View style={S.actionItemStyle} onClick={handleFavorites}>
          <View style={S.actionEmojiStyle}><Text>❤️</Text></View>
          <Text style={S.actionTextStyle}>收藏</Text>
        </View>
      </View>
    </View>
  )
}
