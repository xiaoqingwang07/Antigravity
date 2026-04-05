import { View, Text, Button, Image } from '@tarojs/components'
import Taro, { useRouter, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { pantryStore } from '../../store/pantryStore'
import { findPantryItemForRecipeIngredient } from '../../utils/ingredientMatch'
import { D } from '../../theme/designTokens'
import { DEFAULT_RECIPES } from '../../data/recipes'
import { enrichRecipeMedia } from '../../utils/enrichRecipeMedia'
import { StepFigure } from '../../components/StepFigure'
import type { Recipe, Step } from '../../types/recipe'

const SHARE_SNAPSHOT_KEY = 'sharedRecipeSnapshot'

export default function Detail() {
  const router = useRouter()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [shareMiss, setShareMiss] = useState(false)

  useShareAppMessage(() => {
    if (!recipe) return { title: '爱心厨房 - 今天吃什么？', path: '/pages/index/index' }
    try {
      Taro.setStorageSync(SHARE_SNAPSHOT_KEY, recipe)
    } catch (e) {
      console.warn('share snapshot save failed', e)
    }
    return {
      title: `今晚吃这个 👉【${recipe.title}】`,
      path: `/pages/detail/index?shareId=${recipe.id}`,
      imageUrl: recipe.image || '',
    }
  })

  useShareTimeline(() => {
    if (!recipe) return { title: '爱心厨房 - 今天吃什么？' }
    return {
      title: `${recipe.emoji || '🍽️'} ${recipe.title} | ${recipe.time || 20}分钟搞定`,
    }
  })
  const [cookingMode, setCookingMode] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [stepTimer, setStepTimer] = useState<number | null>(null)
  const [timerRunning, setTimerRunning] = useState(false)

  useEffect(() => {
    const shareId = router.params.shareId
    if (shareId) {
      const preset = DEFAULT_RECIPES.find(r => String(r.id) === String(shareId))
      if (preset) {
        setRecipe(enrichRecipeMedia(preset))
        setShareMiss(false)
        return
      }
      try {
        const snap = Taro.getStorageSync(SHARE_SNAPSHOT_KEY) as Recipe | null
        if (snap && String(snap.id) === String(shareId)) {
          setRecipe(enrichRecipeMedia(snap))
          setShareMiss(false)
          return
        }
      } catch (e) {
        console.warn('share snapshot read failed', e)
      }
      setRecipe(null)
      setShareMiss(true)
      return
    }
    setShareMiss(false)
    const data = Taro.getStorageSync('selectedRecipeDetail') as Recipe | null
    if (data) setRecipe(enrichRecipeMedia(data))
    else setRecipe(null)
  }, [router.params.shareId])

  // 计时器
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timerRunning && stepTimer !== null && stepTimer > 0) {
      interval = setInterval(() => {
        setStepTimer(prev => {
          if (prev === null || prev <= 0) {
            setTimerRunning(false)
            Taro.vibrateLong()
            Taro.showToast({ title: '时间到！', icon: 'none' })
            return null
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timerRunning, stepTimer])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleStartCooking = () => {
    if (!recipe?.steps || recipe.steps.length === 0) return

    const ingredientNames = (recipe.ingredients || []).map(i => i.name)
    const hasMatchInPantry = ingredientNames.some((name) =>
      !!findPantryItemForRecipeIngredient(pantryStore.items, name)
    )

    if (hasMatchInPantry) {
      Taro.showModal({
        title: '库存联动',
        content: '是否自动扣减冰箱中消耗的食材？',
        confirmText: '扣减',
        cancelText: '跳过',
        success: (res) => {
          if (res.confirm) {
            const count = pantryStore.deductItems(ingredientNames)
            Taro.showToast({ title: `已扣减 ${count} 项食材`, icon: 'success' })
          }
          setCookingMode(true)
          setCurrentStep(0)
        }
      })
    } else {
      setCookingMode(true)
      setCurrentStep(0)
    }
  }

  const exitCookingMode = () => {
    setCookingMode(false)
    setCurrentStep(0)
    setStepTimer(null)
    setTimerRunning(false)
  }

  const handleMarkCooked = () => {
    if (!recipe) return
    try {
      const cooked = Taro.getStorageSync('cookedRecipes') || []
      if (!cooked.find((c: any) => c.id === recipe.id)) {
        cooked.unshift({ ...recipe, cookedAt: Date.now() })
        if (cooked.length > 20) cooked.pop()
        Taro.setStorageSync('cookedRecipes', cooked)
      }
      Taro.showToast({ title: '做过啦！💪', icon: 'success' })
    } catch (e) {
      console.error('Mark cooked failed:', e)
    }
  }

  // ============ 烹饪模式 ============
  if (cookingMode && recipe?.steps) {
    const steps = recipe.steps as Step[]
    const totalSteps = steps.length
    const step = steps[currentStep]
    const isLastStep = currentStep === totalSteps - 1

    return (
      <View style={{ minHeight: '100vh', backgroundColor: D.cookingBg, display: 'flex', flexDirection: 'column' }}>
        <View style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: D.cookingMuted, fontSize: '16px' }} onClick={exitCookingMode}>← 退出</Text>
          <Text style={{ color: D.cookingText, fontSize: '18px', fontWeight: '600' }}>{recipe.title}</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '30px' }}>
          <Text style={{ fontSize: '80px', fontWeight: '800', color: D.accentWarm, marginBottom: '20px' }}>
            {currentStep + 1}/{totalSteps}
          </Text>
          <View style={{ width: '100%', maxWidth: 360 }}>
            <StepFigure
              key={`cook-${currentStep}-${step.image || ''}`}
              src={step.image}
              height={200}
              borderRadius={16}
              emoji={recipe.emoji || '🥘'}
              marginBottom={20}
              compactHint
            />
          </View>
          <Text style={{ fontSize: 13, color: D.cookingMuted, textAlign: 'center', marginBottom: 8 }}>
            配图多为氛围参考，请以文字步骤为准
          </Text>
          <Text style={{ fontSize: '28px', color: D.cookingText, textAlign: 'center', lineHeight: '1.5', marginBottom: '30px' }}>
            {step.content}
          </Text>
          {step.tip && (
            <View style={{ fontSize: '16px', color: D.accentWarm, textAlign: 'center', backgroundColor: 'rgba(154, 123, 79, 0.2)', padding: '15px 20px', borderRadius: '12px', marginBottom: '30px' }}>
              💡 {step.tip}
            </View>
          )}
          {step.time && step.time > 0 && (
            <View>
              {stepTimer !== null && <Text style={{ fontSize: '64px', fontWeight: '700', color: timerRunning ? D.accentWarm : D.cookingMuted, marginBottom: '20px', fontFamily: 'monospace' }}>{formatTime(stepTimer)}</Text>}
              <Button style={{ backgroundColor: timerRunning ? D.cookingSurface : D.accent, color: '#fff', padding: '15px 40px', borderRadius: '999px', fontSize: '18px', border: 'none' }} onClick={() => {
                if (timerRunning) {
                  setTimerRunning(false)
                } else {
                  if (stepTimer === null || stepTimer <= 0) {
                    setStepTimer((step.time || 1) * 60)
                  }
                  setTimerRunning(true)
                }
              }}>
                {timerRunning ? '暂停' : stepTimer !== null ? '继续' : '开始计时'}
              </Button>
            </View>
          )}
        </View>

        <View style={{ display: 'flex', justifyContent: 'center', gap: '8px', paddingBottom: '20px' }}>
          {steps.map((_, idx) => (
            <View key={idx} style={{ width: idx === currentStep ? 24 : 8, height: '8px', borderRadius: '4px', backgroundColor: idx === currentStep ? D.accentWarm : D.cookingSurface }} />
          ))}
        </View>

        <View style={{ display: 'flex', gap: '20px', padding: '30px' }}>
          <Button style={{ flex: 1, height: '60px', borderRadius: '30px', fontSize: '18px', backgroundColor: currentStep === 0 ? D.cookingSurface : D.cookingText, color: currentStep === 0 ? D.cookingMuted : D.cookingBg, opacity: currentStep === 0 ? 0.5 : 1 }} onClick={() => currentStep > 0 && setCurrentStep(prev => prev - 1)} disabled={currentStep === 0}>← 上一步</Button>
          <Button style={{ flex: 1, height: '60px', borderRadius: '30px', fontSize: '18px', backgroundColor: D.accent, color: '#fff' }} onClick={() => { if (isLastStep) { Taro.showToast({ title: '🎉 完工！', icon: 'success' }); handleMarkCooked(); exitCookingMode(); } else { setCurrentStep(prev => prev + 1); setStepTimer(null); setTimerRunning(false); } }}>{isLastStep ? '完成 🎉' : '下一步 →'}</Button>
        </View>
      </View>
    )
  }

  // ============ 普通模式 ============
  if (!recipe) {
    if (shareMiss) {
      return (
        <View style={{ padding: 40, minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: D.bg }}>
          <Text style={{ fontSize: 16, color: D.labelSecondary, textAlign: 'center', lineHeight: 1.55 }}>
            无法加载该分享菜谱（非预埋菜或跨设备打开）。请使用首页搜索，或让对方在小程序内重新打开菜谱后再分享。
          </Text>
          <Button style={{ backgroundColor: D.accent, color: '#fff', borderRadius: 999, border: 'none' }} onClick={() => Taro.switchTab({ url: '/pages/index/index' })}>
            回首页
          </Button>
        </View>
      )
    }
    return <View style={{ padding: 40 }}><Text>加载中…</Text></View>
  }

  const steps = recipe.steps as Step[] || []

  const src = recipe.source === 'ai' ? 'AI 生成' : recipe.source === 'cache' ? '缓存' : '本地库'

  return (
    <View style={{ minHeight: '100vh', backgroundColor: D.bg, paddingBottom: '100px' }}>
      <View style={{
        margin: `12px ${D.pagePadH}px 0`,
        borderRadius: D.radiusL,
        backgroundColor: D.bgElevated,
        border: `0.5px solid ${D.separatorLight}`,
        overflow: 'hidden',
        boxShadow: D.shadowCard,
      }}>
        {recipe.image ? (
          <Image
            src={recipe.image}
            mode="aspectFill"
            lazyLoad
            style={{ width: '100%', height: 220, display: 'block', backgroundColor: D.bg }}
          />
        ) : null}
        <View style={{ padding: recipe.image ? '20px 24px 28px' : '36px 24px 28px', alignItems: 'center', backgroundColor: D.bg }}>
          <Text style={{ fontSize: recipe.image ? 40 : 72, lineHeight: 1 }}>{recipe.emoji || '🥘'}</Text>
          <Text style={{ marginTop: 16, fontSize: 24, fontWeight: '700', color: D.label, textAlign: 'center', letterSpacing: '-0.02em' }}>{recipe.title}</Text>
          <Text style={{ marginTop: 8, fontSize: 12, fontWeight: '600', color: D.blue }}>{src}</Text>
          <View style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            {recipe.time ? (
              <Text style={{ fontSize: 12, color: D.labelSecondary, backgroundColor: D.bgElevated, padding: '6px 12px', borderRadius: 999, border: `0.5px solid ${D.separatorLight}` }}>{recipe.time} 分钟</Text>
            ) : null}
            {recipe.difficulty ? (
              <Text style={{ fontSize: 12, color: D.labelSecondary, backgroundColor: D.bgElevated, padding: '6px 12px', borderRadius: 999, border: `0.5px solid ${D.separatorLight}` }}>{recipe.difficulty}</Text>
            ) : null}
          </View>
        </View>
      </View>

      <View style={{ padding: `28px ${D.pagePadH}px 8px` }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: D.labelSecondary, marginBottom: 14, letterSpacing: '0.06em' }}>用料</Text>
        <View style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {recipe.ingredients?.map((ing, idx) => (
            <View key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 12px', backgroundColor: D.bgElevated, borderRadius: D.radiusS, border: `0.5px solid ${D.separatorLight}` }}>
              <Text style={{ fontSize: 14, color: D.label, fontWeight: '600' }}>{ing.name}</Text>
              <Text style={{ fontSize: 13, color: D.labelTertiary }}>{ing.amount}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ padding: `8px ${D.pagePadH}px 28px` }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: D.labelSecondary, marginBottom: 6, letterSpacing: '0.06em' }}>步骤</Text>
        <Text style={{ fontSize: 11, color: D.labelTertiary, lineHeight: 1.45, marginBottom: 14 }}>
          配图为氛围参考或图库示意，与步骤不一定一一对应；操作以文字为准。
        </Text>
        {steps.map((step, idx) => (
          <View key={idx} style={{ marginBottom: 22, display: 'flex', gap: 14 }}>
            <View style={{ width: 28, height: 28, backgroundColor: D.label, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{idx + 1}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <StepFigure src={step.image} height={160} borderRadius={D.radiusM} emoji={recipe.emoji || '🥘'} />
              <Text style={{ fontSize: 16, color: D.label, lineHeight: 1.55 }}>{step.content}</Text>
              {step.tip ? (
                <View style={{ fontSize: 13, color: D.accentWarm, backgroundColor: D.accentWarmMuted, padding: '10px 12px', borderRadius: D.radiusS, marginTop: 10 }}>
                  <Text style={{ fontSize: 13, color: D.accentWarm }}>{step.tip}</Text>
                </View>
              ) : null}
              {step.time ? <Text style={{ fontSize: 12, color: D.labelTertiary, marginTop: 6 }}>约 {step.time} 分钟</Text> : null}
            </View>
          </View>
        ))}
      </View>

      {recipe.nutritionAnalysis ? (
        <View style={{ padding: `0 ${D.pagePadH}px 28px` }}>
          <View style={{ backgroundColor: D.bgElevated, padding: 18, borderRadius: D.radiusM, border: `0.5px solid ${D.separatorLight}` }}>
            <Text style={{ color: D.green, fontWeight: '600', fontSize: 13, marginBottom: 8 }}>营养洞察</Text>
            <Text style={{ color: D.labelSecondary, fontSize: 14, lineHeight: 1.55 }}>{recipe.nutritionAnalysis}</Text>
          </View>
        </View>
      ) : null}

      <View style={{ display: 'flex', gap: 10, padding: `12px ${D.pagePadH}px`, backgroundColor: D.bg, borderTop: `0.5px solid ${D.separatorLight}` }}>
        <Button style={{ flex: 1, height: 48, borderRadius: 999, fontSize: 14, fontWeight: '600', backgroundColor: D.bgElevated, color: D.green, border: `0.5px solid ${D.separator}` }} onClick={handleMarkCooked}>做过啦</Button>
        <Button style={{ flex: 1, height: 48, borderRadius: 999, fontSize: 14, fontWeight: '600', backgroundColor: D.bgElevated, color: D.blue, border: `0.5px solid ${D.separator}` }} open-type="share">分享</Button>
      </View>

      <View style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', padding: `12px ${D.pagePadH}px`, paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', backgroundColor: 'rgba(242,242,247,0.94)', backdropFilter: 'blur(12px)', borderTop: `0.5px solid ${D.separatorLight}`, boxSizing: 'border-box' }}>
        <Button style={{ backgroundColor: D.label, color: '#fff', height: 52, borderRadius: 999, fontWeight: '600', fontSize: 17, border: 'none' }} onClick={handleStartCooking}>{steps.length > 0 ? '开始烹饪' : '暂无步骤'}</Button>
      </View>
    </View>
  )
}
