import { View, Text, Input, Button, ScrollView, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useMemo, type CSSProperties } from 'react'
import { observer } from 'mobx-react-lite'
import { usePantryStore } from '../../store/context'
import { getCategoryForName } from '../../data/shelfLife'
import { getFreshnessStatus, getDaysLeft } from '../../types/pantry'
import type { PantryItem, FreshnessStatus } from '../../types/pantry'
import type { FridgeSide } from '../../types/fridge'
import { slotKind, slotTitle } from '../../types/fridge'
import { parseShoppingLines, suggestPlacementWithBalance } from '../../utils/fridgePlacement'
import { D } from '../../theme/designTokens'

type HighlightMode = 'all' | 'expiring' | 'expired'

const pad = D.pagePadH
const FRIDGE_TIP_KEY = 'pantry_fridge_tip_dismissed'

/** 每层最小高度；左右成对行等高，食材名完整换行 */
const SLOT_PULL_MIN = 56
const SLOT_DRAWER_MIN = 62
const SLOT_STACK_GAP = 5
const SLOT_INDICES = [0, 1, 2, 3, 4, 5, 6] as const

function slotShortLabel(side: FridgeSide, index: number): string {
  const z = side === 'freezer' ? '冻' : '藏'
  return index < 5 ? `${z}·${index + 1}层` : index === 5 ? `${z}·上抽` : `${z}·下抽`
}

function FridgePantry() {
  const store = usePantryStore()
  const [highlight, setHighlight] = useState<HighlightMode>('all')
  const [activeSlot, setActiveSlot] = useState<{ side: FridgeSide; slotIndex: number } | null>(null)
  const [addName, setAddName] = useState('')
  const [addAmount, setAddAmount] = useState('')
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptText, setReceiptText] = useState('')
  const [receiptPreview, setReceiptPreview] = useState<
    { name: string; amount: string; side: FridgeSide; slotIndex: number }[] | null
  >(null)
  const [showFridgeTip, setShowFridgeTip] = useState(() => {
    try {
      return !Taro.getStorageSync(FRIDGE_TIP_KEY)
    } catch {
      return true
    }
  })

  const slotHasHighlight = (side: FridgeSide, slotIndex: number): boolean => {
    const list = store.itemsInSlot(side, slotIndex)
    if (highlight === 'all') return true
    return list.some((i) => {
      const s = getFreshnessStatus(i)
      return highlight === 'expiring' ? s === 'expiring' : s === 'expired'
    })
  }

  const slotDimmed = (side: FridgeSide, slotIndex: number): boolean => {
    if (highlight === 'all') return false
    const list = store.itemsInSlot(side, slotIndex)
    if (list.length === 0) return true
    return !slotHasHighlight(side, slotIndex)
  }

  /** 外柜：金属包边 + 内凹阴影，双开门 */
  const fridgeCabinet: CSSProperties = {
    borderRadius: 22,
    padding: 4,
    background: 'linear-gradient(145deg, #b8c0cc 0%, #dde3ea 38%, #c9d0da 72%, #aeb6c2 100%)',
    boxShadow: '0 12px 40px rgba(18, 22, 28, 0.14), inset 0 1px 0 rgba(255,255,255,0.65)',
  }

  const doorMidSealFill: CSSProperties = {
    width: 6,
    alignSelf: 'stretch',
    flexShrink: 0,
    borderRadius: 2,
    background: 'linear-gradient(90deg, rgba(0,0,0,0.12) 0%, rgba(255,255,255,0.55) 45%, rgba(0,0,0,0.1) 100%)',
    boxShadow: 'inset 0 0 6px rgba(0,0,0,0.15)',
  }

  /** 左门把手靠右、右门把手靠左，贴近中缝 */
  const doorHandle = (edge: 'left' | 'right'): CSSProperties => ({
    position: 'absolute',
    top: '40%',
    zIndex: 2,
    ...(edge === 'right' ? { right: 5 } : { left: 5 }),
    width: 4,
    height: 44,
    borderRadius: 2,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(170,178,190,0.95))',
    boxShadow: edge === 'right' ? 'inset -1px 0 2px rgba(0,0,0,0.08)' : 'inset 1px 0 2px rgba(0,0,0,0.08)',
  })

  const freezerChamber: CSSProperties = {
    flex: 1,
    minWidth: 0,
    borderRadius: 16,
    padding: '8px 7px 10px',
    position: 'relative',
    background: 'linear-gradient(168deg, #d8e6f5 0%, #c5d8ed 28%, #b8cce8 55%, #a8bedd 100%)',
    border: '1px solid rgba(255,255,255,0.5)',
    boxShadow: 'inset 0 3px 14px rgba(255,255,255,0.45), inset 0 -8px 24px rgba(25,55,95,0.12)',
    display: 'flex',
    flexDirection: 'column',
  }

  const fridgeChamber: CSSProperties = {
    flex: 1,
    minWidth: 0,
    borderRadius: 16,
    padding: '8px 7px 10px',
    position: 'relative',
    background: 'linear-gradient(168deg, #f4faf6 0%, #e8f2eb 30%, #dce8df 60%, #d0dfd3 100%)',
    border: '1px solid rgba(255,255,255,0.55)',
    boxShadow: 'inset 0 3px 14px rgba(255,255,255,0.55), inset 0 -8px 24px rgba(45,75,55,0.08)',
    display: 'flex',
    flexDirection: 'column',
  }

  const frostOverlay: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 36,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)',
    pointerEvents: 'none',
  }

  const renderSlot = (side: FridgeSide, index: number) => {
    const items = store.itemsInSlot(side, index)
    const kind = slotKind(index)
    const dim = slotDimmed(side, index)
    const ring =
      highlight !== 'all' &&
      items.some((i) => getFreshnessStatus(i) === (highlight === 'expiring' ? 'expiring' : 'expired'))
    const minH = kind === 'pull' ? SLOT_PULL_MIN : SLOT_DRAWER_MIN
    const isFz = side === 'freezer'
    const summary = items.length === 0 ? '空' : items.map((i) => i.name).join('、')
    return (
      <View
        key={`${side}-${index}`}
        style={{
          minHeight: minH,
          width: '100%',
          borderRadius: 8,
          backgroundColor: isFz ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.52)',
          border: ring ? `1.5px solid ${highlight === 'expiring' ? D.accentWarm : D.red}` : '1px solid rgba(255,255,255,0.65)',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.7)',
          padding: '6px 8px',
          opacity: dim ? 0.35 : 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'stretch',
          boxSizing: 'border-box',
          flex: 1,
          alignSelf: 'stretch',
        }}
        onClick={() => {
          setActiveSlot({ side, slotIndex: index })
          setAddName('')
          setAddAmount('')
        }}
      >
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <Text style={{ fontSize: 9, fontWeight: '700', color: isFz ? 'rgba(30,55,90,0.55)' : 'rgba(35,65,45,0.5)', letterSpacing: '0.06em' }}>
            {kind === 'pull' ? `搁板 ${index + 1}` : index === 5 ? '果菜抽屉' : '保鲜抽屉'}
          </Text>
          {items.length > 0 ? (
            <View style={{ backgroundColor: isFz ? 'rgba(255,255,255,0.55)' : D.accentMuted, padding: '1px 6px', borderRadius: 999, flexShrink: 0 }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: D.accent }}>{items.length}</Text>
            </View>
          ) : null}
        </View>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: items.length === 0 ? D.labelTertiary : D.label,
            marginTop: 4,
            lineHeight: 1.45,
          }}
        >
          {summary}
        </Text>
      </View>
    )
  }

  const ledBar = (isFz: boolean): CSSProperties => ({
    height: 4,
    borderRadius: 2,
    marginBottom: 2,
    background: isFz
      ? 'linear-gradient(90deg, rgba(120,170,230,0.35), rgba(200,230,255,0.9), rgba(120,170,230,0.35))'
      : 'linear-gradient(90deg, rgba(140,200,160,0.25), rgba(230,255,240,0.85), rgba(140,200,160,0.25))',
    boxShadow: '0 0 8px rgba(255,255,255,0.6)',
  })

  const handleAddToSlot = () => {
    if (!activeSlot) return
    if (!addName.trim()) {
      Taro.showToast({ title: '填写名称', icon: 'none' })
      return
    }
    store.addItem(addName.trim(), addAmount.trim() || '适量', {
      side: activeSlot.side,
      slotIndex: activeSlot.slotIndex,
    })
    setAddName('')
    setAddAmount('')
    Taro.showToast({ title: '已放入', icon: 'success' })
  }

  const handleParseReceipt = () => {
    const lines = parseShoppingLines(receiptText)
    if (lines.length === 0) {
      Taro.showToast({ title: '请先输入清单', icon: 'none' })
      return
    }
    const virtual: PantryItem[] = [...store.items]
    const preview: { name: string; amount: string; side: FridgeSide; slotIndex: number }[] = []
    for (const line of lines) {
      const cat = getCategoryForName(line.name)
      const p = suggestPlacementWithBalance(line.name, cat, virtual)
      const now = Date.now()
      virtual.push({
        id: 'virt',
        name: line.name,
        category: cat,
        amount: line.amount,
        addedAt: now,
        expiresAt: now,
        defaultShelfLife: 1,
        side: p.side,
        slotIndex: p.slotIndex,
      })
      preview.push({ name: line.name, amount: line.amount, side: p.side, slotIndex: p.slotIndex })
    }
    setReceiptPreview(preview)
  }

  const handleCommitReceipt = () => {
    if (!receiptPreview?.length) return
    for (const row of receiptPreview) {
      store.addItem(row.name, row.amount, { side: row.side, slotIndex: row.slotIndex })
    }
    setReceiptPreview(null)
    setReceiptText('')
    setShowReceipt(false)
    Taro.showToast({ title: `已入库 ${receiptPreview.length} 项`, icon: 'success' })
  }

  const activeItems = useMemo(() => {
    if (!activeSlot) return []
    return store.itemsInSlot(activeSlot.side, activeSlot.slotIndex)
  }, [activeSlot, store.items])

  const getStatusStyle = (status: FreshnessStatus): CSSProperties => {
    if (status === 'expired') return { color: D.red, backgroundColor: 'rgba(255,59,48,0.08)' }
    if (status === 'expiring') return { color: D.accentWarm, backgroundColor: 'rgba(255,149,0,0.12)' }
    return { color: D.green, backgroundColor: 'rgba(52,199,89,0.1)' }
  }

  return (
    <View style={{ minHeight: '100vh', backgroundColor: D.bg, paddingBottom: 120 }}>
      <ScrollView scrollY showScrollbar={false}>
        <View style={{ padding: `${28}px ${pad}px 12px` }}>
          <Text style={{ fontSize: 32, fontWeight: '600', color: D.label, letterSpacing: '-0.04em' }}>冰箱</Text>
          <Text style={{ fontSize: D.footnote, color: D.labelSecondary, marginTop: 8, lineHeight: 1.5, maxWidth: 340 }}>
            双开门仿真视图：左冷冻、右冷藏，与「选菜」库存同步。格内可直接看到食材名；点格可添加或删除。小票可先粘贴清单。
          </Text>
        </View>

        {showFridgeTip ? (
          <View
            style={{
              margin: `0 ${pad}px 14px`,
              padding: '12px 14px',
              backgroundColor: D.accentMuted,
              borderRadius: D.radiusS,
              border: `0.5px solid ${D.accentLine}`,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Text style={{ flex: 1, fontSize: 12, color: D.label, lineHeight: 1.5 }}>
              每一横排左右两格等高，食材名会完整换行。点格子管理数量与临期；底部可「小票入库」批量添加。
            </Text>
            <Text
              style={{ fontSize: 12, fontWeight: '700', color: D.accent, flexShrink: 0 }}
              onClick={() => {
                try {
                  Taro.setStorageSync(FRIDGE_TIP_KEY, 1)
                } catch { /* ignore */ }
                setShowFridgeTip(false)
              }}
            >
              知道了
            </Text>
          </View>
        ) : null}

        <View style={{ display: 'flex', flexDirection: 'row', gap: 8, padding: `0 ${pad}px`, marginBottom: 18 }}>
          {(
            [
              { k: 'all' as HighlightMode, t: '全貌' },
              { k: 'expiring' as HighlightMode, t: '临期格' },
              { k: 'expired' as HighlightMode, t: '过期格' },
            ] as const
          ).map(({ k, t }) => (
            <View
              key={k}
              style={{
                padding: '8px 14px',
                borderRadius: 999,
                backgroundColor: highlight === k ? D.label : D.bgElevated,
                border: highlight === k ? 'none' : `0.5px solid ${D.separator}`,
              }}
              onClick={() => setHighlight(k)}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: highlight === k ? '#fff' : D.labelSecondary }}>{t}</Text>
            </View>
          ))}
        </View>

        <View style={{ padding: `0 ${pad}px 28px` }}>
          <View style={fridgeCabinet}>
            <View style={{ display: 'flex', flexDirection: 'column' }}>
              {/* 门楣：双室标题 */}
              <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch' }}>
                <View
                  style={{
                    ...freezerChamber,
                    borderRadius: 0,
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 6,
                  }}
                >
                  <View style={frostOverlay} />
                  <View style={doorHandle('right')} />
                  <View style={ledBar(true)} />
                  <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 2 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#1e3a5c', letterSpacing: '-0.02em' }}>❄ 冷冻室</Text>
                    <Text style={{ fontSize: 9, fontWeight: '600', color: 'rgba(30,58,92,0.55)' }}>≈ −18°C</Text>
                  </View>
                </View>
                <View style={doorMidSealFill} />
                <View
                  style={{
                    ...fridgeChamber,
                    borderRadius: 0,
                    borderTopRightRadius: 16,
                    borderTopLeftRadius: 6,
                  }}
                >
                  <View style={doorHandle('left')} />
                  <View style={ledBar(false)} />
                  <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 2 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#2d4a38', letterSpacing: '-0.02em' }}>🥬 冷藏室</Text>
                    <Text style={{ fontSize: 9, fontWeight: '600', color: 'rgba(45,74,56,0.5)' }}>≈ 4°C</Text>
                  </View>
                </View>
              </View>
              {/* 储藏格：同一行左右等高；底角与室色衔接 */}
              <View
                style={{
                  padding: '6px 4px 8px',
                  borderBottomLeftRadius: 14,
                  borderBottomRightRadius: 14,
                  background:
                    'linear-gradient(90deg, #d2e2f2 0%, #d2e2f2 calc(50% - 3px), #ddece0 calc(50% + 3px), #ddece0 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: SLOT_STACK_GAP,
                }}
              >
                {SLOT_INDICES.map((i) => (
                  <View
                    key={`slot-row-${i}`}
                    style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch' }}
                  >
                    <View style={{ flex: 1, minWidth: 0, display: 'flex' }}>{renderSlot('freezer', i)}</View>
                    <View style={doorMidSealFill} />
                    <View style={{ flex: 1, minWidth: 0, display: 'flex' }}>{renderSlot('fridge', i)}</View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={{ padding: `0 ${pad}px 100px` }}>
          <Text style={{ fontSize: 11, color: D.labelTertiary, lineHeight: 1.5 }}>
            拍照识别小票将后续接入；当前请用手动清单，格式每行「食材 数量」。
          </Text>
        </View>
      </ScrollView>

      {/* 格内详情 */}
      {activeSlot ? (
        <View
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(29,29,31,0.35)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setActiveSlot(null)}
        >
          <View
            style={{
              width: '100%',
              maxHeight: '78%',
              backgroundColor: D.bgElevated,
              borderTopLeftRadius: D.radiusXL,
              borderTopRightRadius: D.radiusXL,
              padding: `20px ${pad}px`,
              paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
              boxShadow: D.shadowLift,
            }}
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: D.separator, alignSelf: 'center', marginBottom: 16 }} />
            <Text style={{ fontSize: 18, fontWeight: '600', color: D.label }}>{slotTitle(activeSlot.side, activeSlot.slotIndex)}</Text>
            <Text style={{ fontSize: 12, color: D.labelTertiary, marginTop: 4 }}>{slotShortLabel(activeSlot.side, activeSlot.slotIndex)}</Text>

            <ScrollView scrollY style={{ maxHeight: 220, marginTop: 16 }}>
              {activeItems.map((item) => {
                const st = getFreshnessStatus(item)
                const stStyle = getStatusStyle(st)
                return (
                  <View
                    key={item.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: `0.5px solid ${D.separatorLight}`,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: D.label }}>{item.name}</Text>
                      <Text style={{ fontSize: 12, color: D.labelTertiary, marginTop: 2 }}>{item.amount}</Text>
                      <View style={{ marginTop: 6, alignSelf: 'flex-start', padding: '3px 8px', borderRadius: 6, ...stStyle }}>
                        <Text style={{ fontSize: 10, fontWeight: '600', color: stStyle.color }}>
                          {st === 'expired' ? '已过期' : st === 'expiring' ? `临期 ${getDaysLeft(item)}天` : '新鲜'}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 20, color: D.labelTertiary, padding: 8 }} onClick={() => store.removeItem(item.id)}>
                      ×
                    </Text>
                  </View>
                )
              })}
            </ScrollView>

            <Text style={{ fontSize: 12, fontWeight: '600', color: D.labelSecondary, marginTop: 16, marginBottom: 8 }}>放入此格</Text>
            <Input
              style={{ height: 48, backgroundColor: D.bg, borderRadius: D.radiusS, padding: '0 14px', fontSize: D.body, marginBottom: 8 }}
              placeholder="名称"
              value={addName}
              onInput={(e) => setAddName(e.detail.value)}
            />
            <Input
              style={{ height: 48, backgroundColor: D.bg, borderRadius: D.radiusS, padding: '0 14px', fontSize: D.body, marginBottom: 12 }}
              placeholder="数量"
              value={addAmount}
              onInput={(e) => setAddAmount(e.detail.value)}
            />
            <Button style={{ height: 50, borderRadius: 999, backgroundColor: D.label, color: '#fff', fontSize: D.body, fontWeight: '600', border: 'none' }} onClick={handleAddToSlot}>
              放入
            </Button>
            <Button style={{ marginTop: 10, height: 44, borderRadius: 999, backgroundColor: 'transparent', color: D.labelSecondary, fontSize: D.footnote, border: 'none' }} onClick={() => setActiveSlot(null)}>
              关闭
            </Button>
          </View>
        </View>
      ) : null}

      {/* 小票清单 */}
      {showReceipt ? (
        <View style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(29,29,31,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: pad }}>
          <View style={{ width: '100%', maxWidth: 400, backgroundColor: D.bgElevated, borderRadius: D.radiusXL, padding: 22, maxHeight: '85%' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: D.label }}>购物清单</Text>
            <Text style={{ fontSize: 12, color: D.labelTertiary, marginTop: 6, lineHeight: 1.45 }}>
              每行一件，例：西红柿 500g 或 牛奶、1L
            </Text>
            {!receiptPreview ? (
              <Textarea
                style={{ width: '100%', minHeight: 140, marginTop: 14, padding: '12px 14px', borderRadius: D.radiusS, border: `0.5px solid ${D.separator}`, fontSize: 14, boxSizing: 'border-box', backgroundColor: D.bg }}
                placeholder="粘贴小票或手写清单，每行一件…"
                value={receiptText}
                maxlength={2000}
                onInput={(e) => setReceiptText(e.detail.value)}
              />
            ) : null}
            {receiptPreview ? (
              <ScrollView scrollY style={{ maxHeight: 280, marginTop: 12 }}>
                {receiptPreview.map((row, i) => (
                  <View key={i} style={{ paddingTop: 10, paddingBottom: 10, borderBottom: `0.5px solid ${D.separatorLight}` }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: D.label }}>
                      {row.name} <Text style={{ fontWeight: '400', color: D.labelSecondary }}>{row.amount}</Text>
                    </Text>
                    <Text style={{ fontSize: 12, color: D.accent, marginTop: 4 }}>
                      推荐 → {slotShortLabel(row.side, row.slotIndex)}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            ) : null}
            <View style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              {!receiptPreview ? (
                <>
                  <Button style={{ flex: 1, height: 48, borderRadius: 999, backgroundColor: D.bg, color: D.label, border: 'none', fontSize: D.footnote }} onClick={() => { setShowReceipt(false); setReceiptText('') }}>
                    取消
                  </Button>
                  <Button style={{ flex: 1, height: 48, borderRadius: 999, backgroundColor: D.label, color: '#fff', border: 'none', fontSize: D.footnote, fontWeight: '600' }} onClick={handleParseReceipt}>
                    解析并推荐
                  </Button>
                </>
              ) : (
                <>
                  <Button style={{ flex: 1, height: 48, borderRadius: 999, backgroundColor: D.bg, border: 'none', fontSize: D.footnote }} onClick={() => setReceiptPreview(null)}>
                    返回编辑
                  </Button>
                  <Button style={{ flex: 1, height: 48, borderRadius: 999, backgroundColor: D.accent, color: '#fff', border: 'none', fontSize: D.footnote, fontWeight: '600' }} onClick={handleCommitReceipt}>
                    确认入库
                  </Button>
                </>
              )}
            </View>
          </View>
        </View>
      ) : null}

      <View
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          padding: `12px ${pad}px`,
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
          backgroundColor: D.bgGlass,
          backdropFilter: 'blur(20px)',
          borderTop: `0.5px solid ${D.separatorLight}`,
          display: 'flex',
          gap: 10,
          boxSizing: 'border-box',
        }}
      >
        <Button
          style={{ flex: 1, height: 50, borderRadius: 999, backgroundColor: D.label, color: '#fff', fontSize: D.footnote, fontWeight: '600', border: 'none' }}
          onClick={() => {
            setReceiptPreview(null)
            setShowReceipt(true)
          }}
        >
          小票入库
        </Button>
        {store.expiredCount > 0 ? (
          <Button
            style={{ height: 50, borderRadius: 999, padding: '0 18px', backgroundColor: 'rgba(255,59,48,0.1)', color: D.red, fontSize: 12, fontWeight: '600', border: 'none' }}
            onClick={() => {
              Taro.showModal({
                title: '清理过期',
                content: `移除 ${store.expiredCount} 项？`,
                success: (r) => {
                  if (r.confirm) {
                    store.removeExpired()
                    Taro.showToast({ title: '已清理', icon: 'success' })
                  }
                },
              })
            }}
          >
            清过期
          </Button>
        ) : null}
        <Button
          style={{ height: 50, borderRadius: 999, padding: '0 18px', backgroundColor: D.bgElevated, color: D.accent, fontSize: 12, fontWeight: '600', border: `0.5px solid ${D.separator}` }}
          onClick={() => Taro.switchTab({ url: '/pages/pick/index' })}
        >
          去选菜
        </Button>
      </View>
    </View>
  )
}

export default observer(FridgePantry)
