import { View, Text, Input, ScrollView, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useMemo } from 'react'
import { getSearchHistory, addSearchHistory, clearSearchHistory } from '../../store'
import { getStoredScene, setStoredScene } from '../../api/recipe'
import { fetchLiveWeather, getMockWeather } from '../../api/weather'
import { getWeatherRecommendationsForWeather } from '../../utils/recommend'
import { enrichRecipeMedia } from '../../utils/enrichRecipeMedia'
import type { Recipe, SceneType } from '../../types/recipe'
import * as S from './styles'

const SCENES: { key: SceneType; label: string }[] = [
  { key: 'normal', label: '日常' },
  { key: 'runner', label: '跑后' },
  { key: 'quick', label: '快手' },
  { key: 'muscle', label: '增肌' },
]

export default function Index() {
  const [inputValue, setInputValue] = useState('')
  const [scene, setScene] = useState<SceneType>(() => getStoredScene())
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [weatherBase, setWeatherBase] = useState<WeatherData>(() => getMockWeather())
  const [weatherSource, setWeatherSource] = useState<'live' | 'mock'>('mock')
  const [listVariant, setListVariant] = useState(0)

  const recommendBundle = useMemo(
    () => getWeatherRecommendationsForWeather(weatherBase, 12, listVariant),
    [weatherBase, listVariant]
  )

  const recommendedRecipes = recommendBundle.recipes
  const weatherReason = recommendBundle.reason
  const weather = recommendBundle.weather

  useDidShow(() => {
    const autoSearch = Taro.getStorageSync('autoSearchIngredient')
    if (autoSearch) {
      setInputValue(autoSearch)
      Taro.removeStorageSync('autoSearchIngredient')
    }
    setScene(getStoredScene())
    loadSearchHistory()
    void fetchLiveWeather().then((live) => {
      if (live) {
        setWeatherBase(live)
        setWeatherSource('live')
      } else {
        setWeatherBase(getMockWeather())
        setWeatherSource('mock')
      }
    })
  })

  const loadSearchHistory = () => {
    try {
      const history = getSearchHistory()
      setSearchHistory(history.map((h) => h.keywords))
    } catch (e) {
      console.error('Load history failed:', e)
    }
  }

  const pickScene = (k: SceneType) => {
    setScene(k)
    setStoredScene(k)
  }

  const handleGenerate = () => {
    if (!inputValue.trim()) {
      Taro.showToast({ title: '先告诉我冰箱里有什么呀', icon: 'none' })
      return
    }
    addSearchHistory(inputValue.trim())
    loadSearchHistory()
    setShowHistory(false)
    const q = encodeURIComponent(inputValue.trim())
    Taro.navigateTo({
      url: `/pages/result/index?from=ai&ingredients=${q}&scene=${scene}`,
    })
  }

  const handleRandom = () =>
    Taro.navigateTo({ url: `/pages/result/index?from=random&scene=${scene}` })

  const handleCardClick = (item: Recipe) => {
    Taro.setStorageSync('selectedRecipeDetail', { ...item, source: item.source ?? 'local' })
    Taro.navigateTo({ url: '/pages/detail/index' })
  }

  const handleHistoryClick = (keyword: string) => {
    setInputValue(keyword)
    setShowHistory(false)
  }

  const handleClearHistory = () => {
    clearSearchHistory()
    setSearchHistory([])
    Taro.showToast({ title: '已清空', icon: 'none' })
  }

  const refreshWeather = () => {
    void fetchLiveWeather().then((live) => {
      if (live) {
        setWeatherBase(live)
        setWeatherSource('live')
        Taro.showToast({ title: '已更新天气', icon: 'success' })
      } else {
        Taro.showToast({ title: '暂时无法获取实时天气', icon: 'none' })
      }
    })
  }

  const weatherMeta =
    weatherSource === 'live'
      ? `${weather.temperature}°C · 实时天气（Open-Meteo）`
      : `${weather.temperature}°C · 参考天气（定位/网络不可用时）`

  return (
    <View style={S.pageStyle}>
      <View style={S.headerRowStyle}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={S.titleStyle}>今天想吃点什么？</Text>
          <Text style={S.titleHintStyle}>
            先选场景；输入食材后点「搜索」或键盘搜索/回车即出菜谱
          </Text>
        </View>
        <Text style={S.headerLinkStyle} onClick={() => Taro.navigateTo({ url: '/pages/favorites/index' })}>
          收藏
        </Text>
      </View>

      <View style={S.searchSectionStyle}>
        <View style={S.searchRowStyle}>
          <View style={S.searchBarWrapStyle}>
            <View style={S.searchBarStyle}>
              <Text style={S.searchIconStyle}>⌕</Text>
              <Input
                className="search-input"
                style={{ flex: 1, fontSize: 17, color: '#12110F' }}
                placeholder="番茄、鸡蛋、鸡胸肉…"
                placeholderStyle="color: rgba(18,17,15,0.35)"
                value={inputValue}
                confirmType="search"
                onInput={(e) => setInputValue(e.detail.value)}
                onFocus={() => setShowHistory(true)}
                onConfirm={handleGenerate}
              />
              <View style={S.searchSubmitStyle} onClick={handleGenerate}>
                <Text style={S.searchSubmitTextStyle}>搜索</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={S.sceneRowStyle}>
        <ScrollView scrollX showScrollbar={false} style={S.sceneScrollStyle}>
          {SCENES.map(({ key, label }) => (
            <Text key={key} style={S.sceneChipStyle(scene === key)} onClick={() => pickScene(key)}>
              {label}
            </Text>
          ))}
        </ScrollView>
      </View>

      {showHistory && searchHistory.length > 0 && (
        <View style={S.historyBoxStyle}>
          <View style={S.historyHeaderStyle}>
            <Text style={S.historyTitleStyle}>最近搜索</Text>
            <Text style={S.clearBtnStyle} onClick={handleClearHistory}>
              清除
            </Text>
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

      <View style={S.recipesSectionStyle}>
        <View style={S.sectionHeaderBlockStyle}>
          <Text style={S.sectionTitleStyle}>今日推荐</Text>
          <Text style={S.sectionLeadStyle}>{weatherReason}</Text>
          <View style={S.sectionMetaRowStyle}>
            <Text style={S.sectionMetaTextStyle}>{weatherMeta}</Text>
            <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <Text style={S.sectionMoreStyle} onClick={refreshWeather}>
                刷新天气
              </Text>
              <Text style={S.sectionMoreStyle} onClick={() => setListVariant((v) => v + 1)}>
                换一批
              </Text>
              <Text style={S.sectionMoreStyle} onClick={handleRandom}>
                更多
              </Text>
            </View>
          </View>
        </View>

        <View style={S.deckWrapStyle}>
          {recommendedRecipes.slice(0, 3).map((raw, index) => {
            const item = enrichRecipeMedia({ ...raw, source: raw.source ?? 'local' })
            return (
              <View key={String(item.id) + index} style={S.deckCardStyle(index)} onClick={() => handleCardClick(item)}>
                <View style={S.deckThumbWrapStyle}>
                  {item.image ? (
                    <Image
                      src={item.image}
                      mode="aspectFill"
                      style={{ width: '100%', height: '100%', display: 'block' }}
                      lazyLoad
                    />
                  ) : (
                    <View
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 34 }}>{item.emoji || '🥘'}</Text>
                    </View>
                  )}
                </View>
                <View style={S.deckBodyStyle}>
                  <Text style={S.deckTitleStyle}>{item.title}</Text>
                  <Text style={S.deckTagStyle}>{item.time ?? '—'} 分钟 · 本地库</Text>
                </View>
              </View>
            )
          })}
        </View>

        {recommendedRecipes.length > 3 ? (
          <>
            <Text style={S.moreStripTitleStyle}>更多推荐</Text>
            <ScrollView scrollX showScrollbar={false} style={S.moreStripScrollStyle}>
              {recommendedRecipes.slice(3).map((raw, idx) => {
                const item = enrichRecipeMedia({ ...raw, source: raw.source ?? 'local' })
                return (
                  <View key={`more-${String(item.id)}-${idx}`} style={S.moreChipStyle} onClick={() => handleCardClick(item)}>
                    <View style={S.moreChipThumbStyle}>
                      {item.image ? (
                        <Image src={item.image} mode="aspectFill" style={{ width: '100%', height: '100%' }} lazyLoad />
                      ) : (
                        <Text style={{ fontSize: 22 }}>{item.emoji || '🥘'}</Text>
                      )}
                    </View>
                    <Text style={S.moreChipTitleStyle} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </View>
                )
              })}
            </ScrollView>
          </>
        ) : null}
      </View>
    </View>
  )
}
