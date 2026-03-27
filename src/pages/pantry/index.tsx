import { View, Text, Input, Button, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { usePantryStore } from '../../store/context'
import { getFreshnessStatus, getDaysLeft } from '../../types/pantry'
import type { PantryItem, FreshnessStatus } from '../../types/pantry'

type FilterTab = 'all' | 'expiring' | 'expired'

const CATEGORY_EMOJI: Record<string, string> = {
  vegetable: '🥬', meat: '🥩', seafood: '🦐', fruit: '🍎',
  dairy: '🥛', egg: '🥚', grain: '🍚', seasoning: '🧂', other: '📦',
}

function Pantry() {
  const store = usePantryStore()
  const [filter, setFilter] = useState<FilterTab>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState('')
  const [addAmount, setAddAmount] = useState('')

  const filteredItems = useMemo(() => {
    const sorted = store.sortedByExpiry
    if (filter === 'expiring') return sorted.filter(i => getFreshnessStatus(i) === 'expiring')
    if (filter === 'expired') return sorted.filter(i => getFreshnessStatus(i) === 'expired')
    return sorted
  }, [store.sortedByExpiry, filter])

  const handleAdd = () => {
    if (!addName.trim()) {
      Taro.showToast({ title: '请输入食材名称', icon: 'none' })
      return
    }
    store.addItem(addName.trim(), addAmount.trim() || '适量')
    setAddName('')
    setAddAmount('')
    setShowAdd(false)
    Taro.showToast({ title: '已入库', icon: 'success' })
  }

  const handleRemove = (item: PantryItem) => {
    Taro.showModal({
      title: '移除食材',
      content: `确认从冰箱移除「${item.name}」？`,
      success: (res) => {
        if (res.confirm) {
          store.removeItem(item.id)
          Taro.showToast({ title: '已移除', icon: 'none' })
        }
      }
    })
  }

  const handleClearExpired = () => {
    if (store.expiredCount === 0) return
    Taro.showModal({
      title: '清理过期食材',
      content: `确认移除 ${store.expiredCount} 项过期食材？`,
      success: (res) => {
        if (res.confirm) {
          store.removeExpired()
          Taro.showToast({ title: '已清理', icon: 'success' })
        }
      }
    })
  }

  const getStatusStyle = (status: FreshnessStatus): React.CSSProperties => {
    if (status === 'expired') return { color: '#ef4444', backgroundColor: '#fef2f2' }
    if (status === 'expiring') return { color: '#f97316', backgroundColor: '#fff7ed' }
    return { color: '#22c55e', backgroundColor: '#f0fdf4' }
  }

  const getStatusText = (item: PantryItem): string => {
    const status = getFreshnessStatus(item)
    const days = getDaysLeft(item)
    if (status === 'expired') return `已过期 ${Math.abs(days)} 天`
    if (status === 'expiring') return days <= 0 ? '今天到期' : `剩 ${days} 天`
    return `剩 ${days} 天`
  }

  return (
    <View style={{ minHeight: '100vh', backgroundColor: '#fafafa', paddingBottom: '100px' }}>
      {/* Header */}
      <View style={{ padding: '20px 20px 0' }}>
        <Text style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a2e', display: 'block', marginBottom: '4px' }}>
          我的冰箱
        </Text>
        <Text style={{ fontSize: '14px', color: '#8e8e93', display: 'block', marginBottom: '20px' }}>
          管理食材库存，追踪保质期
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={{ display: 'flex', gap: '12px', padding: '0 20px', marginBottom: '20px' }}>
        <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <Text style={{ fontSize: '28px', fontWeight: '800', color: '#1a1a2e', display: 'block' }}>{store.totalCount}</Text>
          <Text style={{ fontSize: '13px', color: '#8e8e93' }}>总食材</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#fff7ed', borderRadius: '14px', padding: '16px', border: '1px solid #fed7aa' }}>
          <Text style={{ fontSize: '28px', fontWeight: '800', color: '#f97316', display: 'block' }}>{store.expiringCount}</Text>
          <Text style={{ fontSize: '13px', color: '#ea580c' }}>即将过期</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#fef2f2', borderRadius: '14px', padding: '16px', border: '1px solid #fecaca' }}>
          <Text style={{ fontSize: '28px', fontWeight: '800', color: '#ef4444', display: 'block' }}>{store.expiredCount}</Text>
          <Text style={{ fontSize: '13px', color: '#dc2626' }}>已过期</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={{ display: 'flex', gap: '8px', padding: '0 20px', marginBottom: '16px' }}>
        {([
          { key: 'all' as FilterTab, label: '全部' },
          { key: 'expiring' as FilterTab, label: '临期' },
          { key: 'expired' as FilterTab, label: '已过期' },
        ]).map(tab => (
          <View
            key={tab.key}
            style={{
              padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '500',
              ...(filter === tab.key
                ? { backgroundColor: '#f97316', color: '#fff' }
                : { backgroundColor: '#f3f4f6', color: '#6b7280' })
            }}
            onClick={() => setFilter(tab.key)}
          >
            <Text>{tab.label}</Text>
          </View>
        ))}
        <View style={{ flex: 1 }} />
        {store.expiredCount > 0 && (
          <View
            style={{ padding: '8px 12px', borderRadius: '20px', backgroundColor: '#fef2f2', color: '#ef4444', fontSize: '13px' }}
            onClick={handleClearExpired}
          >
            <Text style={{ color: '#ef4444' }}>清理过期</Text>
          </View>
        )}
      </View>

      {/* Item List */}
      <ScrollView scrollY style={{ padding: '0 20px' }}>
        {filteredItems.length === 0 ? (
          <View style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '60px' }}>
            <Text style={{ fontSize: '48px', marginBottom: '12px' }}>
              {filter === 'expired' ? '🎉' : filter === 'expiring' ? '✅' : '🧊'}
            </Text>
            <Text style={{ fontSize: '15px', color: '#8e8e93' }}>
              {filter === 'expired' ? '没有过期食材，很棒！' : filter === 'expiring' ? '没有临期食材' : '冰箱是空的，去添加食材吧'}
            </Text>
          </View>
        ) : (
          filteredItems.map(item => {
            const status = getFreshnessStatus(item)
            const statusStyle = getStatusStyle(status)
            return (
              <View
                key={item.id}
                style={{
                  backgroundColor: '#fff', borderRadius: '14px', padding: '14px 16px',
                  marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '12px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  ...(status === 'expired' ? { opacity: 0.7 } : {})
                }}
              >
                <Text style={{ fontSize: '28px' }}>{CATEGORY_EMOJI[item.category] || '📦'}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Text style={{
                      fontSize: '16px', fontWeight: '600', color: '#1f2937',
                      ...(status === 'expired' ? { textDecoration: 'line-through' } : {})
                    }}>
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: '13px', color: '#9ca3af' }}>{item.amount}</Text>
                  </View>
                  <View style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <View style={{
                      padding: '2px 8px', borderRadius: '6px', fontSize: '12px',
                      ...statusStyle
                    }}>
                      <Text style={{ fontSize: '12px', color: statusStyle.color }}>{getStatusText(item)}</Text>
                    </View>
                    <Text style={{ fontSize: '12px', color: '#c4c4c6' }}>
                      {new Date(item.addedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })} 入库
                    </Text>
                  </View>
                </View>
                <Text
                  style={{ fontSize: '18px', padding: '8px', color: '#d1d5db' }}
                  onClick={() => handleRemove(item)}
                >✕</Text>
              </View>
            )
          })
        )}
      </ScrollView>

      {/* Add Modal */}
      {showAdd && (
        <View style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <View style={{ width: '85%', backgroundColor: '#fff', borderRadius: '20px', padding: '24px' }}>
            <Text style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a2e', display: 'block', marginBottom: '20px' }}>添加食材</Text>
            <Input
              style={{ height: '44px', backgroundColor: '#f3f4f6', borderRadius: '12px', padding: '0 16px', fontSize: '15px', marginBottom: '12px' }}
              placeholder='食材名称（如：西红柿）'
              value={addName}
              onInput={e => setAddName(e.detail.value)}
            />
            <Input
              style={{ height: '44px', backgroundColor: '#f3f4f6', borderRadius: '12px', padding: '0 16px', fontSize: '15px', marginBottom: '20px' }}
              placeholder='数量（如：3个、500g）'
              value={addAmount}
              onInput={e => setAddAmount(e.detail.value)}
            />
            <View style={{ display: 'flex', gap: '12px' }}>
              <Button
                style={{ flex: 1, height: '44px', borderRadius: '22px', backgroundColor: '#f3f4f6', color: '#6b7280', fontSize: '15px', border: 'none' }}
                onClick={() => setShowAdd(false)}
              >取消</Button>
              <Button
                style={{ flex: 1, height: '44px', borderRadius: '22px', backgroundColor: '#f97316', color: '#fff', fontSize: '15px', border: 'none' }}
                onClick={handleAdd}
              >确认入库</Button>
            </View>
          </View>
        </View>
      )}

      {/* Bottom Action Bar */}
      <View style={{
        position: 'fixed', bottom: 0, left: 0, width: '100%',
        padding: '16px 20px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
        backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
        borderTop: '1px solid #f3f4f6', display: 'flex', gap: '12px', boxSizing: 'border-box'
      }}>
        <Button
          style={{ flex: 1, height: '50px', borderRadius: '25px', backgroundColor: '#f97316', color: '#fff', fontSize: '16px', fontWeight: '600', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowAdd(true)}
        >
          + 添加食材
        </Button>
        {store.expiringCount > 0 && (
          <Button
            style={{ height: '50px', borderRadius: '25px', backgroundColor: '#fff7ed', color: '#f97316', fontSize: '14px', fontWeight: '600', border: '1px solid #f97316', padding: '0 20px' }}
            onClick={() => Taro.switchTab({ url: '/pages/pick/index' })}
          >
            去消耗
          </Button>
        )}
      </View>
    </View>
  )
}

export default observer(Pantry)
