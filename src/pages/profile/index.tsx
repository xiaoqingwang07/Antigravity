import { View, Text, Input, Button, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { usePantryStore } from '../../store/context'
import { getFavoriteCount, getCookedRecipes, getSearchHistory, clearSearchHistory } from '../../store'
import { checkApiKey } from '../../api/recipe'
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

  useEffect(() => {
    const key = Taro.getStorageSync('DEEPSEEK_API_KEY') || ''
    setApiKey(key)
    const count = Taro.getStorageSync('defaultDinersCount') || 2
    setDinersCount(count)
  }, [])

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      Taro.showToast({ title: '请输入 API Key', icon: 'none' })
      return
    }
    Taro.setStorageSync('DEEPSEEK_API_KEY', apiKey.trim())
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
    { label: '冰箱食材', value: pantryStore.totalCount, color: '#f97316' },
    { label: '收藏菜谱', value: favCount, color: '#ef4444' },
    { label: '做过的菜', value: getCookedRecipes().length, color: '#22c55e' },
  ]

  if (showSearchHistory) {
    return (
      <View style={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
        <View style={{ padding: '20px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Text style={{ fontSize: '16px', color: '#f97316' }} onClick={() => setShowSearchHistory(false)}>← 返回</Text>
            <Text style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a2e' }}>搜索历史</Text>
          </View>
          {searchHistoryItems.length > 0 && (
            <Text style={{ fontSize: '14px', color: '#ef4444' }} onClick={handleClearSearchHistory}>清空</Text>
          )}
        </View>
        <ScrollView scrollY style={{ padding: '20px' }}>
          {searchHistoryItems.length === 0 ? (
            <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '80px' }}>
              <Text style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</Text>
              <Text style={{ fontSize: '15px', color: '#8e8e93' }}>暂无搜索记录</Text>
            </View>
          ) : (
            searchHistoryItems.map((item, idx) => (
              <View
                key={`${item.timestamp}-${idx}`}
                style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '14px 16px', marginBottom: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                onClick={() => handleSearchKeywordTap(item.keywords)}
              >
                <Text style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', display: 'block' }}>{item.keywords}</Text>
                <Text style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px', display: 'block' }}>
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
      <View style={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
        <View style={{ padding: '20px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Text style={{ fontSize: '16px', color: '#f97316' }} onClick={() => setShowHistory(false)}>← 返回</Text>
          <Text style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a2e' }}>做过的菜</Text>
        </View>
        <ScrollView scrollY style={{ padding: '20px' }}>
          {cookedRecipes.length === 0 ? (
            <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '80px' }}>
              <Text style={{ fontSize: '48px', marginBottom: '12px' }}>👨‍🍳</Text>
              <Text style={{ fontSize: '15px', color: '#8e8e93' }}>还没有做过菜的记录</Text>
            </View>
          ) : (
            cookedRecipes.map((item, idx) => (
              <View
                key={idx}
                style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '14px 16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                onClick={() => {
                  Taro.setStorageSync('selectedRecipeDetail', item)
                  Taro.navigateTo({ url: '/pages/detail/index' })
                }}
              >
                <Text style={{ fontSize: '32px' }}>{item.emoji || '🥘'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', display: 'block' }}>{item.title}</Text>
                  <Text style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {new Date(item.cookedAt).toLocaleDateString('zh-CN')} 做过
                  </Text>
                </View>
                <Text style={{ color: '#d1d5db' }}>›</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    )
  }

  if (showAbout) {
    return (
      <View style={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
        <View style={{ padding: '20px', backgroundColor: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Text style={{ fontSize: '16px', color: '#f97316' }} onClick={() => setShowAbout(false)}>← 返回</Text>
          <Text style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a2e' }}>关于</Text>
        </View>
        <View style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Text style={{ fontSize: '64px', marginBottom: '16px' }}>🍳</Text>
          <Text style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a2e', marginBottom: '4px' }}>爱心厨房</Text>
          <Text style={{ fontSize: '14px', color: '#8e8e93', marginBottom: '24px' }}>Love Kitchen v1.0</Text>
          <View style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '20px', width: '100%', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <Text style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.8', display: 'block' }}>
              面向家庭的 AI 厨房助手微信小程序。
            </Text>
            <Text style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.8', display: 'block', marginTop: '8px' }}>
              解决「今天吃什么、怎么做」以及食材浪费问题。通过极简管理、智能决策、高效执行，让每一餐都有爱。
            </Text>
            <Text style={{ fontSize: '13px', color: '#9ca3af', display: 'block', marginTop: '16px' }}>
              技术栈：Taro + React + TypeScript + MobX + DeepSeek AI
            </Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#f97316', padding: '40px 20px 30px', borderRadius: '0 0 24px 24px' }}>
        <View style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <View style={{ width: '60px', height: '60px', borderRadius: '30px', backgroundColor: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: '32px' }}>👨‍🍳</Text>
          </View>
          <View>
            <Text style={{ fontSize: '20px', fontWeight: '700', color: '#fff', display: 'block' }}>爱心厨房</Text>
            <Text style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>让每一餐都有爱</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          {stats.map((s, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
              <Text style={{ fontSize: '22px', fontWeight: '800', color: '#fff', display: 'block' }}>{s.value}</Text>
              <Text style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Menu */}
      <View style={{ padding: '20px' }}>
        {/* API Key Setting */}
        <View
          style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
          onClick={() => setShowApiKeyInput(!showApiKeyInput)}
        >
          <Text style={{ fontSize: '24px' }}>🔑</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', display: 'block' }}>API Key 设置</Text>
            <Text style={{ fontSize: '13px', color: apiKey ? (apiKeyValid === false ? '#ef4444' : '#22c55e') : '#9ca3af' }}>
              {apiKey ? (apiKeyValid === false ? 'Key 无效' : `已配置 (${apiKey.slice(0, 8)}...)`) : '未配置'}
            </Text>
          </View>
          <Text style={{ fontSize: '16px', color: '#d1d5db' }}>{showApiKeyInput ? '▾' : '›'}</Text>
        </View>

        {showApiKeyInput && (
          <View style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', marginTop: '-4px' }}>
            <Input
              style={{ height: '44px', backgroundColor: '#f3f4f6', borderRadius: '12px', padding: '0 16px', fontSize: '14px', marginBottom: '12px' }}
              placeholder='请输入 DeepSeek API Key'
              value={apiKey}
              onInput={e => setApiKey(e.detail.value)}
              password
            />
            <Button
              style={{ height: '40px', backgroundColor: '#f97316', color: '#fff', borderRadius: '20px', fontSize: '14px', border: 'none' }}
              onClick={handleSaveApiKey}
            >保存并验证</Button>
          </View>
        )}

        {/* Diners Count */}
        <View style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <Text style={{ fontSize: '24px' }}>👥</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', display: 'block' }}>默认就餐人数</Text>
            <Text style={{ fontSize: '13px', color: '#9ca3af' }}>推荐菜谱份量参考</Text>
          </View>
          <View style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <View
              style={{ width: '32px', height: '32px', borderRadius: '16px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => handleDinersChange(-1)}
            ><Text style={{ fontSize: '18px', color: '#6b7280' }}>-</Text></View>
            <Text style={{ fontSize: '18px', fontWeight: '700', color: '#f97316', minWidth: '24px', textAlign: 'center' }}>{dinersCount}</Text>
            <View
              style={{ width: '32px', height: '32px', borderRadius: '16px', backgroundColor: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => handleDinersChange(1)}
            ><Text style={{ fontSize: '18px', color: '#fff' }}>+</Text></View>
          </View>
        </View>

        {/* History */}
        <View
          style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
          onClick={handleShowHistory}
        >
          <Text style={{ fontSize: '24px' }}>📋</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', display: 'block' }}>烹饪记录</Text>
            <Text style={{ fontSize: '13px', color: '#9ca3af' }}>做过的菜</Text>
          </View>
          <Text style={{ fontSize: '16px', color: '#d1d5db' }}>›</Text>
        </View>

        <View
          style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
          onClick={openSearchHistory}
        >
          <Text style={{ fontSize: '24px' }}>🔍</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', display: 'block' }}>搜索历史</Text>
            <Text style={{ fontSize: '13px', color: '#9ca3af' }}>首页食材搜索关键词</Text>
          </View>
          <Text style={{ fontSize: '16px', color: '#d1d5db' }}>›</Text>
        </View>

        {/* Favorites */}
        <View
          style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
          onClick={() => Taro.navigateTo({ url: '/pages/favorites/index' })}
        >
          <Text style={{ fontSize: '24px' }}>❤️</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', display: 'block' }}>我的收藏</Text>
            <Text style={{ fontSize: '13px', color: '#9ca3af' }}>{favCount} 道收藏的菜谱</Text>
          </View>
          <Text style={{ fontSize: '16px', color: '#d1d5db' }}>›</Text>
        </View>

        {/* About */}
        <View
          style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
          onClick={() => setShowAbout(true)}
        >
          <Text style={{ fontSize: '24px' }}>ℹ️</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', display: 'block' }}>关于</Text>
            <Text style={{ fontSize: '13px', color: '#9ca3af' }}>爱心厨房 v1.0</Text>
          </View>
          <Text style={{ fontSize: '16px', color: '#d1d5db' }}>›</Text>
        </View>

        {/* Reset Mock Data */}
        <View
          style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
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
            <Text style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', display: 'block' }}>重置冰箱数据</Text>
            <Text style={{ fontSize: '13px', color: '#9ca3af' }}>恢复示例食材数据</Text>
          </View>
          <Text style={{ fontSize: '16px', color: '#d1d5db' }}>›</Text>
        </View>
      </View>
    </View>
  )
}

export default observer(Profile)
