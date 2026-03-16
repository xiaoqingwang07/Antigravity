import { View, Text, ScrollView, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useMemo } from 'react'
import { getSearchHistory, addSearchHistory } from '../../store'

// Categories from the reference image
const CATEGORIES = [
  {
    title: '蔬菜 / Veggie',
    items: ['芋头', '木耳', '豆芽', '金针菇', '藕', '青菜', '白萝卜', '西葫芦', '生菜', '香菇', '娃娃菜', '丝瓜', '红薯', '豆角', '粉丝', '莴笋', '包菜', '芹菜', '杏鲍菇', '山药', '油麦菜', '油菜', '韭菜', '苦瓜', '平菇']
  },
  {
    title: '肉类 / Meat',
    items: ['猪肉', '排骨', '五花肉', '牛肉', '鸡肉', '鸡翅', '鸡腿', '鸡胸肉', '羊肉', '鱼', '虾', '鸡蛋', '牛腩', '牛腱', '肥牛', '牛排', '牛肉丸', '火腿肠', '午餐肉', '虾仁', '虾滑', '巴沙鱼', '鲈鱼', '带鱼']
  },
  {
    title: '水果 / Fruit',
    items: ['苹果', '香蕉', '蓝莓', '柠檬', '草莓', '牛油果', '西瓜', '葡萄']
  }
]

// Quick select common ingredients
const QUICK_SELECT = ['鸡蛋', '西红柿', '鸡胸肉', '土豆', '洋葱', '大蒜', '辣椒', '胡萝卜']

export default function Fridge() {
  const [selected, setSelected] = useState<string[]>([])
  const [inputValue, setInputValue] = useState('')
  const [activeTab, setActiveTab] = useState<'食材' | '常做'>('食材')

  // 加载保存的食材
  useMemo(() => {
    const saved = Taro.getStorageSync('savedIngredients')
    if (saved && Array.isArray(saved)) {
      setSelected(saved)
    }
  }, [])

  const toggleSelect = (name: string) => {
    if (selected.includes(name)) {
      setSelected(selected.filter(n => n !== name))
    } else {
      setSelected([...selected, name])
    }
  }

  const handleInputConfirm = () => {
    if (inputValue.trim()) {
      toggleSelect(inputValue.trim())
      setInputValue('')
    }
  }

  const handleQuickSelect = (item: string) => {
    toggleSelect(item)
  }

  const handleMatch = () => {
    if (selected.length === 0) {
      Taro.showToast({ title: '先选些食材吧~', icon: 'none' })
      return
    }
    // 保存到 storage
    Taro.setStorageSync('savedIngredients', selected)
    // 保存搜索历史
    addSearchHistory(selected.join('、'))
    
    const params = selected.join(',')
    Taro.navigateTo({
      url: `/pages/result/index?auto=true&ingredients=${encodeURIComponent(params)}`
    })
  }

  const handleClear = () => {
    setSelected([])
    Taro.removeStorageSync('savedIngredients')
  }

  const handleBackToHome = () => {
    if (selected.length > 0) {
      Taro.setStorageSync('autoSearchIngredient', selected.join('、'))
    }
    Taro.switchTab({ url: '/pages/index/index' })
  }

  // ============ Styles ============
  const S = useMemo(() => ({
    container: {
      minHeight: '100vh',
      backgroundColor: '#fafafa',
      paddingBottom: '120px'
    } as React.CSSProperties,
    header: {
      padding: '20px',
      backgroundColor: '#fff'
    } as React.CSSProperties,
    headerTop: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px'
    } as React.CSSProperties,
    backBtn: {
      fontSize: '16px',
      color: '#f97316',
      padding: '8px'
    } as React.CSSProperties,
    pageTitle: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#1a1a2e'
    } as React.CSSProperties,
    tabRow: {
      display: 'flex',
      gap: '12px',
      marginBottom: '16px'
    } as React.CSSProperties,
    tab: {
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: '500'
    } as React.CSSProperties,
    tabActive: {
      backgroundColor: '#f97316',
      color: '#fff'
    } as React.CSSProperties,
    tabInactive: {
      backgroundColor: '#f3f4f6',
      color: '#6b7280'
    } as React.CSSProperties,
    statsRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px'
    } as React.CSSProperties,
    selectedCount: {
      fontSize: '14px',
      color: '#8e8e93'
    } as React.CSSProperties,
    clearBtn: {
      fontSize: '13px',
      color: '#ef4444'
    } as React.CSSProperties,
    inputRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '16px'
    } as React.CSSProperties,
    input: {
      flex: 1,
      height: '44px',
      backgroundColor: '#f3f4f6',
      borderRadius: '12px',
      padding: '0 16px',
      fontSize: '15px'
    } as React.CSSProperties,
    addBtn: {
      width: '44px',
      height: '44px',
      backgroundColor: '#f97316',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontSize: '20px'
    } as React.CSSProperties,
    quickRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexWrap: 'wrap' as const,
      marginBottom: '20px'
    } as React.CSSProperties,
    quickLabel: {
      fontSize: '13px',
      color: '#8e8e93'
    } as React.CSSProperties,
    quickTag: {
      backgroundColor: '#fff',
      border: '1px solid #e5e7eb',
      padding: '6px 12px',
      borderRadius: '8px',
      fontSize: '13px',
      color: '#4b5563'
    } as React.CSSProperties,
    quickTagActive: {
      backgroundColor: '#fff7ed',
      border: '1px solid #f97316',
      color: '#f97316'
    } as React.CSSProperties,
    section: {
      padding: '20px'
    } as React.CSSProperties,
    categoryTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '12px'
    } as React.CSSProperties,
    categoryGrid: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '8px',
      marginBottom: '24px'
    } as React.CSSProperties,
    ingredientTag: {
      padding: '8px 14px',
      borderRadius: '10px',
      fontSize: '14px',
      backgroundColor: '#fff',
      border: '1px solid #e5e7eb',
      color: '#4b5563'
    } as React.CSSProperties,
    ingredientTagActive: {
      backgroundColor: '#f97316',
      border: '1px solid #f97316',
      color: '#fff'
    } as React.CSSProperties,
    bottomBar: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      backgroundColor: '#fff',
      padding: '16px 20px',
      paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
      boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.06)',
      display: 'flex',
      gap: '12px',
      boxSizing: 'border-box'
    } as React.CSSProperties,
    matchBtn: {
      flex: 1,
      height: '50px',
      backgroundColor: '#f97316',
      borderRadius: '25px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontSize: '16px',
      fontWeight: '600',
      border: 'none' as const
    } as React.CSSProperties,
    selectedBar: {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#fff7ed',
      borderRadius: '25px',
      padding: '0 16px',
      border: '1px solid #f97316'
    } as React.CSSProperties,
    selectedText: {
      flex: 1,
      fontSize: '14px',
      color: '#f97316',
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    } as React.CSSProperties
  }), [selected])

  return (
    <View style={S.container}>
      {/* Header */}
      <View style={S.header}>
        <View style={S.headerTop}>
          <Text style={S.backBtn} onClick={handleBackToHome}>← 首页</Text>
          <Text style={S.pageTitle}>清冰箱</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Tab */}
        <View style={S.tabRow}>
          <View 
            style={{ ...S.tab, ...(activeTab === '食材' ? S.tabActive : S.tabInactive) }}
            onClick={() => setActiveTab('食材')}
          >
            <Text>食材</Text>
          </View>
          <View 
            style={{ ...S.tab, ...(activeTab === '常做' ? S.tabActive : S.tabInactive) }}
            onClick={() => setActiveTab('常做')}
          >
            <Text>常做</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={S.statsRow}>
          <Text style={S.selectedCount}>已选 {selected.length} 种食材</Text>
          {selected.length > 0 && (
            <Text style={S.clearBtn} onClick={handleClear}>清空</Text>
          )}
        </View>

        {/* Input */}
        <View style={S.inputRow}>
          <Input
            style={S.input}
            placeholder='添加其他食材...'
            value={inputValue}
            onInput={(e) => setInputValue(e.detail.value)}
            onConfirm={handleInputConfirm}
          />
          <View style={S.addBtn} onClick={handleInputConfirm}>+</View>
        </View>

        {/* Quick Select */}
        <View style={S.quickRow}>
          <Text style={S.quickLabel}>常用：</Text>
          {QUICK_SELECT.map(item => (
            <View 
              key={item}
              style={{ ...S.quickTag, ...(selected.includes(item) ? S.quickTagActive : {}) }}
              onClick={() => handleQuickSelect(item)}
            >
              {item} {selected.includes(item) && '✓'}
            </View>
          ))}
        </View>
      </View>

      {/* Category List */}
      {activeTab === '食材' && (
        <ScrollView style={S.section}>
          {CATEGORIES.map(cat => (
            <View key={cat.title}>
              <Text style={S.categoryTitle}>{cat.title}</Text>
              <View style={S.categoryGrid}>
                {cat.items.map(item => (
                  <View 
                    key={item}
                    style={{ ...S.ingredientTag, ...(selected.includes(item) ? S.ingredientTagActive : {}) }}
                    onClick={() => toggleSelect(item)}
                  >
                    {item} {selected.includes(item) && '✓'}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {activeTab === '常做' && (
        <View style={{ padding: '40px 20px', textAlign: 'center' }}>
          <Text style={{ fontSize: '48px', marginBottom: '16px' }}>👨🍳</Text>
          <Text style={{ color: '#8e8e93', fontSize: '14px' }}>这里将显示你曾经做过的菜</Text>
        </View>
      )}

      {/* Bottom Bar */}
      <View style={S.bottomBar}>
        {selected.length > 0 && (
          <View style={S.selectedBar}>
            <Text style={S.selectedText}>{selected.join('、')}</Text>
          </View>
        )}
        <Button 
          style={S.matchBtn}
          onClick={handleMatch}
          disabled={selected.length === 0}
        >
          {selected.length > 0 ? `AI 推荐 (${selected.length}种)` : '开始匹配'}
        </Button>
      </View>
    </View>
  )
}
