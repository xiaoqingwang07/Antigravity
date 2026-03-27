import { View, Text, ScrollView, Input, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { usePantryStore } from '../../store/context'
import { addSearchHistory } from '../../store'
import { getFreshnessStatus, getDaysLeft } from '../../types/pantry'

const CATEGORIES = [
  {
    title: '蔬菜',
    emoji: '🥬',
    items: ['芋头', '木耳', '豆芽', '金针菇', '藕', '青菜', '白萝卜', '西葫芦', '生菜', '香菇', '娃娃菜', '丝瓜', '红薯', '豆角', '莴笋', '包菜', '芹菜', '杏鲍菇', '山药', '油麦菜', '油菜', '韭菜', '苦瓜', '平菇', '西红柿', '黄瓜', '茄子', '西兰花', '菠菜', '南瓜', '胡萝卜', '花菜', '青椒', '豆腐', '洋葱', '土豆']
  },
  {
    title: '肉类',
    emoji: '🥩',
    items: ['猪肉', '排骨', '五花肉', '牛肉', '鸡肉', '鸡翅', '鸡腿', '鸡胸肉', '羊肉', '鱼', '虾', '鸡蛋', '牛腩', '牛腱', '肥牛', '牛排', '牛肉丸', '火腿肠', '午餐肉', '虾仁', '虾滑', '巴沙鱼', '鲈鱼', '带鱼', '三文鱼', '里脊肉', '肉末']
  },
  {
    title: '水果',
    emoji: '🍎',
    items: ['苹果', '香蕉', '蓝莓', '柠檬', '草莓', '牛油果', '西瓜', '葡萄', '橙子', '芒果']
  },
  {
    title: '主食 / 干货',
    emoji: '🍚',
    items: ['米饭', '面条', '意面', '吐司', '馒头', '饺子皮', '粉条', '粉丝', '年糕']
  }
]

function Pick() {
  const pantryStore = usePantryStore()
  const [selected, setSelected] = useState<string[]>([])
  const [inputValue, setInputValue] = useState('')
  const [initialized, setInitialized] = useState(false)

  const expiringNames = useMemo(() => {
    return pantryStore.expiringItems.map(i => i.name)
  }, [pantryStore.expiringItems])

  useDidShow(() => {
    if (!initialized && expiringNames.length > 0) {
      setSelected(expiringNames.slice(0, 2))
      setInitialized(true)
    }
  })

  const toggleSelect = (name: string) => {
    setSelected(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )
  }

  const handleInputConfirm = () => {
    const v = inputValue.trim()
    if (v) {
      toggleSelect(v)
      setInputValue('')
    }
  }

  const handleMatch = () => {
    if (selected.length === 0) {
      Taro.showToast({ title: '先选些食材吧~', icon: 'none' })
      return
    }
    Taro.setStorageSync('savedIngredients', selected)
    addSearchHistory(selected.join('、'))
    Taro.navigateTo({
      url: `/pages/result/index?from=pantry&ingredients=${encodeURIComponent(selected.join(','))}`
    })
  }

  const handleClear = () => setSelected([])

  return (
    <View style={{ minHeight: '100vh', backgroundColor: '#fafafa', paddingBottom: '120px' }}>
      {/* Header */}
      <View style={{ padding: '20px 20px 0', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a2e', display: 'block', marginBottom: '4px' }}>选菜</Text>
        <Text style={{ fontSize: '14px', color: '#8e8e93', display: 'block', marginBottom: '16px' }}>选择食材，智能匹配菜谱</Text>
      </View>

      {/* Expiring Highlight */}
      {expiringNames.length > 0 && (
        <View style={{ margin: '0 20px 16px', padding: '14px 16px', backgroundColor: '#fff7ed', borderRadius: '14px', border: '1px solid #fed7aa' }}>
          <View style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <Text style={{ fontSize: '14px', fontWeight: '600', color: '#ea580c' }}>⏰ 冰箱里快过期了！优先消耗</Text>
          </View>
          <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {pantryStore.expiringItems.map(item => {
              const days = getDaysLeft(item)
              const isSelected = selected.includes(item.name)
              return (
                <View
                  key={item.id}
                  style={{
                    padding: '6px 12px', borderRadius: '8px', fontSize: '13px',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    ...(isSelected
                      ? { backgroundColor: '#f97316', color: '#fff', border: '1px solid #f97316' }
                      : { backgroundColor: '#fff', color: '#ea580c', border: '1px solid #fed7aa' }
                    )
                  }}
                  onClick={() => toggleSelect(item.name)}
                >
                  <Text style={{ color: isSelected ? '#fff' : '#ea580c', fontSize: '13px' }}>
                    {item.name}
                  </Text>
                  <Text style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : '#fb923c', fontSize: '11px' }}>
                    {days <= 0 ? '今天' : `${days}天`}
                  </Text>
                  {isSelected && <Text style={{ color: '#fff', fontSize: '12px' }}> ✓</Text>}
                </View>
              )
            })}
          </View>
        </View>
      )}

      {/* Stats + Input */}
      <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: '12px' }}>
        <Text style={{ fontSize: '14px', color: '#8e8e93' }}>已选 {selected.length} 种食材</Text>
        {selected.length > 0 && (
          <Text style={{ fontSize: '13px', color: '#ef4444' }} onClick={handleClear}>清空</Text>
        )}
      </View>

      <View style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 20px', marginBottom: '20px' }}>
        <Input
          style={{ flex: 1, height: '44px', backgroundColor: '#f3f4f6', borderRadius: '12px', padding: '0 16px', fontSize: '15px' }}
          placeholder='手动添加食材...'
          value={inputValue}
          onInput={(e) => setInputValue(e.detail.value)}
          onConfirm={handleInputConfirm}
        />
        <View
          style={{ width: '44px', height: '44px', backgroundColor: '#f97316', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={handleInputConfirm}
        >
          <Text style={{ color: '#fff', fontSize: '20px' }}>+</Text>
        </View>
      </View>

      {/* Category Grid */}
      <ScrollView scrollY style={{ padding: '0 20px' }}>
        {CATEGORIES.map(cat => (
          <View key={cat.title}>
            <View style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', marginTop: '16px' }}>
              <Text>{cat.emoji}</Text>
              <Text style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{cat.title}</Text>
            </View>
            <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {cat.items.map(item => {
                const isSelected = selected.includes(item)
                const isExpiring = expiringNames.includes(item)
                return (
                  <View
                    key={item}
                    style={{
                      padding: '8px 14px', borderRadius: '10px', fontSize: '14px',
                      ...(isSelected
                        ? { backgroundColor: '#f97316', border: '1px solid #f97316', color: '#fff' }
                        : isExpiring
                          ? { backgroundColor: '#fff7ed', border: '1px solid #fed7aa', color: '#ea580c' }
                          : { backgroundColor: '#fff', border: '1px solid #e5e7eb', color: '#4b5563' }
                      )
                    }}
                    onClick={() => toggleSelect(item)}
                  >
                    <Text>{item}</Text>
                    {isSelected && <Text> ✓</Text>}
                  </View>
                )
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Bar */}
      <View style={{
        position: 'fixed', bottom: 0, left: 0, width: '100%', backgroundColor: '#fff',
        padding: '16px 20px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.06)', display: 'flex', gap: '12px', boxSizing: 'border-box'
      }}>
        {selected.length > 0 && (
          <View style={{
            display: 'flex', alignItems: 'center', backgroundColor: '#fff7ed',
            borderRadius: '25px', padding: '0 16px', border: '1px solid #f97316',
            maxWidth: '50%', overflow: 'hidden'
          }}>
            <Text style={{ fontSize: '14px', color: '#f97316', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {selected.join('、')}
            </Text>
          </View>
        )}
        <Button
          style={{
            flex: 1, height: '50px', backgroundColor: selected.length > 0 ? '#f97316' : '#d1d5db',
            borderRadius: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '16px', fontWeight: '600', border: 'none'
          }}
          onClick={handleMatch}
          disabled={selected.length === 0}
        >
          {selected.length > 0 ? `智能匹配菜谱 (${selected.length}种)` : '请选择食材'}
        </Button>
      </View>
    </View>
  )
}

export default observer(Pick)
