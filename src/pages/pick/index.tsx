import { View, Text, ScrollView, Input, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { usePantryStore } from '../../store/context'
import { addSearchHistory } from '../../store'
import { getDaysLeft } from '../../types/pantry'
import type { PantryItem } from '../../types/pantry'
import { getStoredScene } from '../../api/recipe'
import { D } from '../../theme/designTokens'

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

function slotHint(p: PantryItem): string {
  const z = p.side === 'freezer' ? '冻' : '藏'
  return p.slotIndex < 5 ? `${z}${p.slotIndex + 1}层` : p.slotIndex === 5 ? `${z}上抽` : `${z}下抽`
}

function Pick() {
  const pantryStore = usePantryStore()
  const [selected, setSelected] = useState<string[]>([])
  const [inputValue, setInputValue] = useState('')
  const [initialized, setInitialized] = useState(false)
  const [ingredientFilter, setIngredientFilter] = useState('')

  const expiringNames = useMemo(() => {
    return pantryStore.expiringItems.map(i => i.name)
  }, [pantryStore.expiringItems])

  const filterHasMatch = useMemo(() => {
    const raw = ingredientFilter.trim()
    if (!raw) return true
    const q = raw.toLowerCase()
    return CATEGORIES.some((cat) =>
      cat.items.some((name) => name.toLowerCase().includes(q) || name.includes(raw))
    )
  }, [ingredientFilter])

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
    const scene = getStoredScene()
    Taro.navigateTo({
      url: `/pages/result/index?from=pantry&ingredients=${encodeURIComponent(selected.join(','))}&scene=${scene}`
    })
  }

  const handleClear = () => setSelected([])

  const handleImportPantry = () => {
    const names = pantryStore.items.map((i) => i.name)
    if (names.length === 0) {
      Taro.showToast({ title: '冰箱还是空的', icon: 'none' })
      return
    }
    setSelected((prev) => Array.from(new Set([...prev, ...names])))
    Taro.showToast({ title: `已合并冰箱 ${names.length} 项`, icon: 'success' })
  }

  return (
    <View style={{ minHeight: '100vh', backgroundColor: D.bg, paddingBottom: '120px' }}>
      <View style={{ padding: '24px 22px 8px' }}>
        <Text style={{ fontSize: 28, fontWeight: '700', color: D.label, display: 'block', marginBottom: 6, letterSpacing: '-0.03em' }}>选菜</Text>
        <Text style={{ fontSize: D.footnote, color: D.labelSecondary, lineHeight: 1.45 }}>
          从列表点选、输入添加或与临期食材一并勾选，再匹配菜谱
        </Text>
      </View>

      {/* 临期 + 手动添加：同一选择面板 */}
      <View style={{ margin: '12px 22px 16px', padding: '18px 18px', backgroundColor: D.bgElevated, borderRadius: D.radiusM, border: `0.5px solid ${D.separatorLight}`, boxShadow: D.shadowCard }}>
        <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: D.label, letterSpacing: '-0.02em' }}>选择食材</Text>
          <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {selected.length > 0 ? (
              <Text style={{ fontSize: D.footnote, color: D.red, fontWeight: '500' }} onClick={handleClear}>清空</Text>
            ) : null}
            <Text style={{ fontSize: 11, color: D.labelTertiary }} onClick={handleImportPantry}>导入冰箱</Text>
          </View>
        </View>
        <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginBottom: 10 }}>已选 {selected.length} 种</Text>

        {expiringNames.length > 0 && (
          <>
            <Text style={{ fontSize: D.caption, fontWeight: '600', color: D.accentWarm, marginBottom: 8, letterSpacing: '0.06em' }}>临期 · 优先消耗</Text>
            <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: 16 }}>
              {pantryStore.expiringItems.map(item => {
                const days = getDaysLeft(item)
                const isSelected = selected.includes(item.name)
                return (
                  <View
                    key={item.id}
                    style={{
                      padding: '6px 12px', borderRadius: D.radiusS, fontSize: '13px',
                      display: 'flex', alignItems: 'center', gap: '4px',
                      ...(isSelected
                        ? { backgroundColor: D.accent, border: `0.5px solid ${D.accent}` }
                        : { backgroundColor: D.accentWarmMuted, border: `0.5px solid ${D.accentLine}` }
                      )
                    }}
                    onClick={() => toggleSelect(item.name)}
                  >
                    <Text style={{ color: isSelected ? '#fff' : D.label, fontSize: '13px' }}>
                      {item.name}
                    </Text>
                    <Text style={{ color: isSelected ? 'rgba(255,255,255,0.85)' : D.accentWarm, fontSize: '11px' }}>
                      {slotHint(item)} · {days <= 0 ? '今天' : `${days}天`}
                    </Text>
                    {isSelected ? <Text style={{ color: '#fff', fontSize: '12px' }}> ✓</Text> : null}
                  </View>
                )
              })}
            </View>
            <View style={{ height: 0.5, backgroundColor: D.separator, marginBottom: 16 }} />
          </>
        )}

        <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginBottom: 8 }}>手动输入</Text>
        <View style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Input
            style={{ flex: 1, height: '44px', backgroundColor: D.bg, borderRadius: D.radiusS, padding: '0 16px', fontSize: '15px', border: `0.5px solid ${D.separatorLight}` }}
            placeholder='输入食材名称，回车或点添加'
            value={inputValue}
            onInput={(e) => setInputValue(e.detail.value)}
            onConfirm={handleInputConfirm}
          />
          <View
            style={{ width: '44px', height: '44px', backgroundColor: D.accent, borderRadius: D.radiusS, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={handleInputConfirm}
          >
            <Text style={{ color: '#fff', fontSize: '20px', fontWeight: '300' }}>+</Text>
          </View>
        </View>
      </View>

      <View style={{ padding: '0 22px 8px' }}>
        <Text style={{ fontSize: D.caption, color: D.labelTertiary, marginBottom: 8 }}>筛选食材（输入即过滤列表）</Text>
        <Input
          style={{
            height: 44,
            backgroundColor: D.bgElevated,
            borderRadius: D.radiusS,
            padding: '0 16px',
            fontSize: 15,
            border: `0.5px solid ${D.separatorLight}`,
          }}
          placeholder="例如：茄、鸡胸、菇…"
          value={ingredientFilter}
          onInput={(e) => setIngredientFilter(e.detail.value)}
        />
      </View>

      {!filterHasMatch ? (
        <View style={{ padding: '12px 22px' }}>
          <Text style={{ fontSize: 13, color: D.labelTertiary, textAlign: 'center' }}>
            没有匹配的食材，试试别的关键字或清空筛选
          </Text>
        </View>
      ) : null}

      {/* Category Grid */}
      <ScrollView scrollY style={{ padding: '0 22px' }}>
        {CATEGORIES.map((cat) => {
          const q = ingredientFilter.trim().toLowerCase()
          const items = q
            ? cat.items.filter((name) => name.toLowerCase().includes(q) || name.includes(ingredientFilter.trim()))
            : cat.items
          if (items.length === 0) return null
          return (
          <View key={cat.title}>
            <View style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', marginTop: '16px' }}>
              <Text>{cat.emoji}</Text>
              <Text style={{ fontSize: '16px', fontWeight: '600', color: D.label }}>{cat.title}</Text>
            </View>
            <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {items.map(item => {
                const isSelected = selected.includes(item)
                const isExpiring = expiringNames.includes(item)
                const pin = pantryStore.items.find((i) => i.name === item)
                return (
                  <View
                    key={item}
                    style={{
                      padding: '8px 14px', borderRadius: 12, fontSize: 14,
                      ...(isSelected
                        ? { backgroundColor: D.label, border: `0.5px solid ${D.label}`, color: '#fff' }
                        : isExpiring
                          ? { backgroundColor: D.accentWarmMuted, border: `0.5px solid rgba(255,149,0,0.35)`, color: D.label }
                          : { backgroundColor: D.bgElevated, border: `0.5px solid ${D.separator}`, color: D.label }
                      )
                    }}
                    onClick={() => toggleSelect(item)}
                  >
                    <Text style={{ fontSize: 14 }}>{item}</Text>
                    {pin ? (
                      <Text style={{ fontSize: 10, color: isSelected ? 'rgba(255,255,255,0.75)' : D.labelTertiary, marginTop: 2 }}>{slotHint(pin)}</Text>
                    ) : null}
                    {isSelected ? <Text> ✓</Text> : null}
                  </View>
                )
              })}
            </View>
          </View>
          )
        })}
      </ScrollView>

      {/* Bottom Bar */}
      <View style={{
        position: 'fixed', bottom: 0, left: 0, width: '100%', backgroundColor: D.bgElevated,
        padding: '16px 20px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
        boxShadow: '0 -4px 24px rgba(18,17,15,0.06)', display: 'flex', gap: '12px', boxSizing: 'border-box',
        borderTop: `0.5px solid ${D.separatorLight}`,
      }}>
        {selected.length > 0 && (
          <View style={{
            display: 'flex', alignItems: 'center', backgroundColor: D.accentMuted,
            borderRadius: 999, padding: '0 14px', border: `0.5px solid ${D.accentLine}`,
            maxWidth: '48%', overflow: 'hidden'
          }}>
            <Text style={{ fontSize: 13, color: D.accent, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {selected.join('、')}
            </Text>
          </View>
        )}
        <Button
          style={{
            flex: 1, height: '50px', backgroundColor: selected.length > 0 ? D.accent : 'rgba(18,17,15,0.12)',
            borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '16px', fontWeight: '600', border: 'none'
          }}
          onClick={handleMatch}
          disabled={selected.length === 0}
        >
          {selected.length > 0 ? `匹配菜谱 · ${selected.length} 种` : '请选择食材'}
        </Button>
      </View>
    </View>
  )
}

export default observer(Pick)
