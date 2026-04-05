import { View, Text, Input, Button, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { usePantryStore } from '../../store/context'
import { getFavoriteCount, getCookedRecipes, getSearchHistory, clearSearchHistory } from '../../store'
import { checkApiKey, getLlmApiKey, getStoredScene, setStoredScene } from '../../api/recipe'
import { D } from '../../theme/designTokens'
import type { SceneType } from '../../types/recipe'
import type { Recipe } from '../../types/recipe'

function Profile() {
  const pantryStore = usePantryStore()
  const [apiKey, setApiKey] = useState('')
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null)
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showSearchHistory, setShowSearchHistory] = useState(false)
  const [searchHistoryItems, setSearchHistoryItems] = useState(() => getSearchHistory())
  const [showAbout, setShowAbout] = useState(false)
  const [cookedRecipes, setCookedRecipes] = useState<(Recipe & { cookedAt: number })[]>([])
  const [dinersCount, setDinersCount] = useState(2)
  const [recipeScene, setRecipeScene] = useState<SceneType>(() => getStoredScene())
  const [apiKeyFromBuild, setApiKeyFromBuild] = useState(false)

  useEffect(() => {
    const stored =
      Taro.getStorageSync('LLM_API_KEY') || Taro.getStorageSync('DEEPSEEK_API_KEY') || ''
    setApiKey(stored)
    const count = Taro.getStorageSync('defaultDinersCount') || 2
    setDinersCount(count)
    setRecipeScene(getStoredScene())
    const injected = !stored && getLlmApiKey().length > 0
    setApiKeyFromBuild(injected)
    if (injected) {
      void checkApiKey().then((r) => setApiKeyValid(r.valid))
    }
  }, [])

  const SCENE_OPTIONS: { key: SceneType; label: string }[] = [
    { key: 'normal', label: '日常' },
    { key: 'runner', label: '跑后' },
    { key: 'quick', label: '快手' },
    { key: 'muscle', label: '增肌' },
  ]

  const applyScene = (k: SceneType) => {
    setRecipeScene(k)
    setStoredScene(k)
    Taro.showToast({ title: '已保存推荐场景', icon: 'success' })
  }

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      Taro.showToast({ title: '请输入 API Key', icon: 'none' })
      return
    }
    const v = apiKey.trim()
    Taro.setStorageSync('LLM_API_KEY', v)
    Taro.setStorageSync('DEEPSEEK_API_KEY', v)
    Taro.showLoading({ title: '验证中...' })
    const result = await checkApiKey()
    Taro.hideLoading()
    setApiKeyValid(result.valid)
    if (result.valid) {
      Taro.showToast({ title: 'API Key 有效', icon: 'success' })
      setShowApiKeyInput(false)
    } else {
      Taro.showModal({ title: '验证失败', content: result.error || 'Key 无效', showCancel: false })
    }
  }

  const handleShowHistory = () => {
    setCookedRecipes(getCookedRecipes())
    setShowHistory(true)
  }

  const openSearchHistory = () => {
    setSearchHistoryItems(getSearchHistory())
    setShowSearchHistory(true)
  }

  const handleSearchKeywordTap = (keywords: string) => {
    Taro.setStorageSync('autoSearchIngredient', keywords)
    setShowSearchHistory(false)
    Taro.switchTab({ url: '/pages/index/index' })
  }

  const handleClearSearchHistory = () => {
    clearSearchHistory()
    setSearchHistoryItems([])
    Taro.showToast({ title: '已清空', icon: 'none' })
  }

  const handleDinersChange = (delta: number) => {
    const next = Math.max(1, Math.min(10, dinersCount + delta))
    setDinersCount(next)
    Taro.setStorageSync('defaultDinersCount', next)
  }

  const favCount = getFavoriteCount()

  const stats = [
    { label: '冰箱食材', value: pantryStore.totalCount, color: D.accent },
    { label: '收藏菜谱', value: favCount, color: D.red },
    { label: '做过的菜', value: getCookedRecipes().length, color: D.green },
  ]

  if (showSearchHistory) {
    return (
      <View style={{ minHeight: '100vh', backgroundColor: D.bg }}>
        <View style={{ padding: '20px', backgroundColor: D.bgElevated, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `0.5px solid ${D.separatorLight}` }}>
          <View style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Text style={{ fontSize: '16px', color: D.accent }} onClick={() => setShowSearchHistory(false)}>← 返回</Text>
            <Text style={{ fontSize: '18px', fontWeight: '700', color: D.label }}>搜索历史</Text>
          </View>
          {searchHistoryItems.length > 0 && (
            <Text style={{ fontSize: '14px', color: D.red }} onClick={handleClearSearchHistory}>清空</Text>
          )}
        </View>
        <ScrollView scrollY style={{ padding: '20px' }}>
          {searchHistoryItems.length === 0 ? (
            <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '80px' }}>
              <Text style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</Text>
              <Text style={{ fontSize: '15px', color: D.labelTertiary }}>暂无搜索记录</Text>
            </View>
          ) : (
            searchHistoryItems.map((item, idx) => (
              <View
                key={`${item.timestamp}-${idx}`}
                style={{ backgroundColor: D.bgElevated, borderRadius: D.radiusS, padding: '14px 16px', marginBottom: '10px', border: `0.5px solid ${D.separatorLight}`, boxShadow: D.shadowCard }}
                onClick={() => handleSearchKeywordTap(item.keywords)}
              >
                <Text style={{ fontSize: '16px', fontWeight: '600', color: D.label, display: 'block' }}>{item.keywords}</Text>
                <Text style={{ fontSize: '12px', color: D.labelTertiary, marginTop: '4px', display: 'block' }}>
                  {new Date(item.timestamp).toLocaleString('zh-CN')} · 点击回首页搜索
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    )
  }

  // Main profile view
  if (showHistory) {
    return (
      <View style={{ minHeight: '100vh', backgroundColor: D.bg }}>
        <View style={{ padding: '20px', backgroundColor: D.bgElevated, display: 'flex', alignItems: 'center', gap: '12px', borderBottom: `0.5px solid ${D.separatorLight}` }}>
          <Text style={{ fontSize: '16px', color: D.accent }} onClick={() => setShowHistory(false)}>← 返回</Text>
          <Text style={{ fontSize: '18px', fontWeight: '700', color: D.label }}>做过的菜</Text>
        </View>
        <ScrollView scrollY style={{ padding: '20px' }}>
          {cookedRecipes.length === 0 ? (
            <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '80px' }}>
              <Text style={{ fontSize: '48px', marginBottom: '12px' }}>👨‍🍳</Text>
              <Text style={{ fontSize: '15px', color: D.labelTertiary }}>还没有做过菜的记录</Text>
            </View>
          ) : (
            cookedRecipes.map((item, idx) => (
              <View
                key={idx}
                style={{ backgroundColor: D.bgElevated, borderRadius: D.radiusS, padding: '14px 16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px', border: `0.5px solid ${D.separatorLight}`, boxShadow: D.shadowCard }}
                onClick={() => {
                  Taro.setStorageSync('selectedRecipeDetail', item)
                  Taro.navigateTo({ url: '/pages/detail/index' })
                }}
              >
                <Text style={{ fontSize: '32px' }}>{item.emoji || '🥘'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: '16px', fontWeight: '600', color: D.label, display: 'block' }}>{item.title}</Text>
                  <Text style={{ fontSize: '12px', color: D.labelTertiary }}>
                    {new Date(item.cookedAt).toLocaleDateString('zh-CN')} 做过
                  </Text>
                </View>
                <Text style={{ color: D.labelTertiary }}>›</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    )
  }

  if (showAbout) {
    return (
      <View style={{ minHeight: '100vh', backgroundColor: D.bg }}>
        <View style={{ padding: '20px', backgroundColor: D.bgElevated, display: 'flex', alignItems: 'center', gap: '12px', borderBottom: `0.5px solid ${D.separatorLight}` }}>
          <Text style={{ fontSize: '16px', color: D.accent }} onClick={() => setShowAbout(false)}>← 返回</Text>
          <Text style={{ fontSize: '18px', fontWeight: '700', color: D.label }}>关于</Text>
        </View>
        <View style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Text style={{ fontSize: '64px', marginBottom: '16px' }}>🍳</Text>
          <Text style={{ fontSize: '22px', fontWeight: '700', color: D.label, marginBottom: '4px' }}>爱心厨房</Text>
          <Text style={{ fontSize: '14px', color: D.labelTertiary, marginBottom: '24px' }}>Love Kitchen v1.0</Text>
          <View style={{ backgroundColor: D.bgElevated, borderRadius: D.radiusS, padding: '20px', width: '100%', border: `0.5px solid ${D.separatorLight}`, boxShadow: D.shadowCard }}>
            <Text style={{ fontSize: '14px', color: D.labelSecondary, lineHeight: '1.8', display: 'block' }}>
              面向家庭的 AI 厨房助手微信小程序。
            </Text>
            <Text style={{ fontSize: '14px', color: D.labelSecondary, lineHeight: '1.8', display: 'block', marginTop: '8px' }}>
              解决「今天吃什么、怎么做」以及食材浪费问题。通过极简管理、智能决策、高效执行，让每一餐都有爱。
            </Text>
            <Text style={{ fontSize: '13px', color: D.labelTertiary, display: 'block', marginTop: '16px' }}>
              技术栈：Taro + React + TypeScript + MobX + MiniMax（MiniMax-M2.7）。实时天气来自 Open-Meteo（需在小程序后台配置 request 合法域名）。
            </Text>
          </View>
        </View>
      </View>
    )
  }

  return (
      <View style={{ minHeight: '100vh', backgroundColor: D.bg }}>
      <View style={{ padding: '28px 22px 20px' }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: D.label, letterSpacing: '-0.03em' }}>我的</Text>
        <Text style={{ fontSize: D.footnote, color: D.labelSecondary, marginTop: 6 }}>爱心厨房</Text>
        <View style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          {stats.map((s, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: D.bgElevated, borderRadius: D.radiusM, padding: '14px 10px', textAlign: 'center', border: `0.5px solid ${D.separatorLight}` }}>
              <Text style={{ fontSize: 22, fontWeight: '700', color: D.label, display: 'block' }}>{s.value}</Text>
              <Text style={{ fontSize: 11, color: D.labelSecondary, marginTop: 4 }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Menu */}
      <View style={{ padding: '0 22px 32px' }}>
        <View style={{ backgroundColor: D.bgElevated, borderRadius: D.radiusM, padding: 16, marginBottom: 12, border: `0.5px solid ${D.separatorLight}` }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: D.labelSecondary, marginBottom: 12 }}>默认 AI 场景</Text>
          <View style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SCENE_OPTIONS.map(({ key, label }) => (
              <View
                key={key}
                style={{
                  padding: '8px 14px',
                  borderRadius: 999,
                  backgroundColor: recipeScene === key ? D.label : D.bg,
                  border: recipeScene === key ? 'none' : `0.5px solid ${D.separator}`,
                }}
                onClick={() => applyScene(key)}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: recipeScene === key ? '#fff' : D.labelSecondary }}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
        {/* API Key Setting */}
        <View
          style={{ backgroundColor: D.bgElevated, borderRadius: D.radiusS, padding: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', border: `0.5px solid ${D.separatorLight}`, boxShadow: D.shadowCard }}
          onClick={() => setShowApiKeyInput(!showApiKeyInput)}
        >
          <Text style={{ fontSize: '24px' }}>🔑</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '16px', fontWeight: '600', color: D.label, display: 'block' }}>MiniMax API Key</Text>
            <Text style={{ fontSize: '13px', color: (apiKey.trim() || apiKeyFromBuild) ? (apiKeyValid === false ? D.red : D.green) : D.labelTertiary }}>
              {apiKey.trim()
                ? (apiKeyValid === false ? 'Key 无效' : `已配置 (${apiKey.slice(0, 8)}…)`)
                : apiKeyFromBuild
                  ? (apiKeyValid === false ? '本地配置的 Key 无效' : '已通过 .env.local 注入 MiniMax Key')
                  : '未配置'}
            </Text>
          </View>
          <Text style={{ fontSize: '16px', color: D.labelTertiary }}>{showApiKeyInput ? '▾' : '›'}</Text>
        </View>

        {showApiKeyInput && (
          <View style={{ backgroundColor: D.bgElevated, borderRadius: D.radiusS, padding: '16px', marginBottom: '12px', marginTop: '-4px', border: `0.5px solid ${D.separatorLight}` }}>
            <Text style={{ fontSize: 12, color: D.labelTertiary, marginBottom: 8, lineHeight: 1.45 }}>
              也可在项目根 .env.local 写入 TARO_APP_MINIMAX_API_KEY（勿提交）。接口域名为 api.minimaxi.com；小程序请在后台将 request 合法域名加入 https://api.minimaxi.com。此处填写会覆盖注入。
            </Text>
            <Input
              style={{ height: '44px', backgroundColor: D.bg, borderRadius: '12px', padding: '0 16px', fontSize: '14px', marginBottom: '12px', border: `0.5px solid ${D.separatorLight}` }}
              placeholder='MiniMax API Key（可选，已用 .env.local 可留空）'
              value={apiKey}
              onInput={e => setApiKey(e.detail.value)}
              password
            />
            <Button
              style={{ height: '40px', backgroundColor: D.accent, color: '#fff', borderRadius: '20px', fontSize: '14px', border: 'none' }}
              onClick={handleSaveApiKey}
            >保存并验证</Button>
          </View>
        )}

        {/* Diners Count */}
        <View style={{ backgroundColor: D.bgElevated, borderRadius: D.radiusS, padding: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', border: `0.5px solid ${D.separatorLight}`, boxShadow: D.shadowCard }}>
          <Text style={{ fontSize: '24px' }}>👥</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '16px', fontWeight: '600', color: D.label, display: 'block' }}>默认就餐人数</Text>
            <Text style={{ fontSize: '13px', color: D.labelTertiary }}>推荐菜谱份量参考</Text>
          </View>
          <View style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <View
              style={{ width: '32px', height: '32px', borderRadius: '16px', backgroundColor: D.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `0.5px solid ${D.separatorLight}` }}
              onClick={() => handleDinersChange(-1)}
            ><Text style={{ fontSize: '18px', color: D.blue }}>-</Text></View>
            <Text style={{ fontSize: '18px', fontWeight: '700', color: D.accent, minWidth: '24px', textAlign: 'center' }}>{dinersCount}</Text>
            <View
              style={{ width: '32px', height: '32px', borderRadius: '16px', backgroundColor: D.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => handleDinersChange(1)}
            ><Text style={{ fontSize: '18px', color: '#fff' }}>+</Text></View>
          </View>
        </View>

        {/* History */}
        <View
          style={{ backgroundColor: D.bgElevated, borderRadius: D.radiusS, padding: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', border: `0.5px solid ${D.separatorLight}`, boxShadow: D.shadowCard }}
          onClick={handleShowHistory}
        >
          <Text style={{ fontSize: '24px' }}>📋</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '16px', fontWeight: '600', color: D.label, display: 'block' }}>烹饪记录</Text>
            <Text style={{ fontSize: '13px', color: D.labelTertiary }}>做过的菜</Text>
          </View>
          <Text style={{ fontSize: '16px', color: D.labelTertiary }}>›</Text>
        </View>

        <View
          style={{ backgroundColor: D.bgElevated, borderRadius: D.radiusS, padding: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', border: `0.5px solid ${D.separatorLight}`, boxShadow: D.shadowCard }}
          onClick={openSearchHistory}
        >
          <Text style={{ fontSize: '24px' }}>🔍</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '16px', fontWeight: '600', color: D.label, display: 'block' }}>搜索历史</Text>
            <Text style={{ fontSize: '13px', color: D.labelTertiary }}>首页食材搜索关键词</Text>
          </View>
          <Text style={{ fontSize: '16px', color: D.labelTertiary }}>›</Text>
        </View>

        {/* Favorites */}
        <View
          style={{ backgroundColor: D.bgElevated, borderRadius: D.radiusS, padding: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', border: `0.5px solid ${D.separatorLight}`, boxShadow: D.shadowCard }}
          onClick={() => Taro.navigateTo({ url: '/pages/favorites/index' })}
        >
          <Text style={{ fontSize: '24px' }}>❤️</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '16px', fontWeight: '600', color: D.label, display: 'block' }}>我的收藏</Text>
            <Text style={{ fontSize: '13px', color: D.labelTertiary }}>{favCount} 道收藏的菜谱</Text>
          </View>
          <Text style={{ fontSize: '16px', color: D.labelTertiary }}>›</Text>
        </View>

        {/* About */}
        <View
          style={{ backgroundColor: D.bgElevated, borderRadius: D.radiusS, padding: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', border: `0.5px solid ${D.separatorLight}`, boxShadow: D.shadowCard }}
          onClick={() => setShowAbout(true)}
        >
          <Text style={{ fontSize: '24px' }}>ℹ️</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '16px', fontWeight: '600', color: D.label, display: 'block' }}>关于</Text>
            <Text style={{ fontSize: '13px', color: D.labelTertiary }}>爱心厨房 v1.0</Text>
          </View>
          <Text style={{ fontSize: '16px', color: D.labelTertiary }}>›</Text>
        </View>

        {/* Reset Mock Data */}
        <View
          style={{ backgroundColor: D.bgElevated, borderRadius: D.radiusS, padding: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', border: `0.5px solid ${D.separatorLight}`, boxShadow: D.shadowCard }}
          onClick={() => {
            Taro.showModal({
              title: '重置冰箱',
              content: '将冰箱食材恢复为示例数据，确认？',
              success: (res) => {
                if (res.confirm) {
                  pantryStore.resetToMock()
                  Taro.showToast({ title: '已重置', icon: 'success' })
                }
              }
            })
          }}
        >
          <Text style={{ fontSize: '24px' }}>🔄</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '16px', fontWeight: '600', color: D.label, display: 'block' }}>重置冰箱数据</Text>
            <Text style={{ fontSize: '13px', color: D.labelTertiary }}>恢复示例食材数据</Text>
          </View>
          <Text style={{ fontSize: '16px', color: D.labelTertiary }}>›</Text>
        </View>
      </View>
    </View>
  )
}

export default observer(Profile)
