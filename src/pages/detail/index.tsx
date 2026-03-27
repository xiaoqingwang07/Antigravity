import { View, Text, Button } from '@tarojs/components'
import Taro, { useRouter, useShareAppMessage, useShareTimeline } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { pantryStore } from '../../store/pantryStore'
import { DEFAULT_RECIPES } from '../../data/recipes'
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
        setRecipe(preset)
        setShareMiss(false)
        return
      }
      try {
        const snap = Taro.getStorageSync(SHARE_SNAPSHOT_KEY) as Recipe | null
        if (snap && String(snap.id) === String(shareId)) {
          setRecipe(snap)
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
    const data = Taro.getStorageSync('selectedRecipeDetail')
    if (data) setRecipe(data)
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
    const hasMatchInPantry = ingredientNames.some(name =>
      pantryStore.items.some(p => p.name === name)
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
      <View style={{ minHeight: '100vh', backgroundColor: '#1a1a2e', display: 'flex', flexDirection: 'column' }}>
        <View style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: '16px' }} onClick={exitCookingMode}>← 退出</Text>
          <Text style={{ color: '#fff', fontSize: '18px', fontWeight: '600' }}>{recipe.title}</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '30px' }}>
          <Text style={{ fontSize: '80px', fontWeight: '800', color: '#f97316', marginBottom: '20px' }}>
            {currentStep + 1}/{totalSteps}
          </Text>
          <Text style={{ fontSize: '32px', color: '#fff', textAlign: 'center', lineHeight: '1.5', marginBottom: '30px' }}>
            {step.content}
          </Text>
          {step.tip && (
            <View style={{ fontSize: '18px', color: '#fbbf24', textAlign: 'center', backgroundColor: 'rgba(251, 191, 36, 0.1)', padding: '15px 20px', borderRadius: '12px', marginBottom: '30px' }}>
              💡 {step.tip}
            </View>
          )}
          {step.time && step.time > 0 && (
            <View>
              {stepTimer !== null && <Text style={{ fontSize: '64px', fontWeight: '700', color: timerRunning ? '#f97316' : '#8e8e93', marginBottom: '20px', fontFamily: 'monospace' }}>{formatTime(stepTimer)}</Text>}
              <Button style={{ backgroundColor: timerRunning ? '#374151' : '#f97316', color: '#fff', padding: '15px 40px', borderRadius: '999px', fontSize: '18px', border: 'none' }} onClick={() => {
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
            <View key={idx} style={{ width: idx === currentStep ? 24 : 8, height: '8px', borderRadius: '4px', backgroundColor: idx === currentStep ? '#f97316' : '#374151' }} />
          ))}
        </View>

        <View style={{ display: 'flex', gap: '20px', padding: '30px' }}>
          <Button style={{ flex: 1, height: '60px', borderRadius: '30px', fontSize: '18px', backgroundColor: currentStep === 0 ? '#374151' : '#fff', color: currentStep === 0 ? '#666' : '#1a1a2e', opacity: currentStep === 0 ? 0.5 : 1 }} onClick={() => currentStep > 0 && setCurrentStep(prev => prev - 1)} disabled={currentStep === 0}>← 上一步</Button>
          <Button style={{ flex: 1, height: '60px', borderRadius: '30px', fontSize: '18px', backgroundColor: '#f97316', color: '#fff' }} onClick={() => { if (isLastStep) { Taro.showToast({ title: '🎉 完工！', icon: 'success' }); handleMarkCooked(); exitCookingMode(); } else { setCurrentStep(prev => prev + 1); setStepTimer(null); setTimerRunning(false); } }}>{isLastStep ? '完成 🎉' : '下一步 →'}</Button>
        </View>
      </View>
    )
  }

  // ============ 普通模式 ============
  if (!recipe) {
    if (shareMiss) {
      return (
        <View style={{ padding: 40, minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <Text style={{ fontSize: 16, color: '#6b7280', textAlign: 'center' }}>
            无法加载该分享菜谱（非预埋菜或跨设备打开）。请使用首页搜索，或让对方在小程序内重新打开菜谱后再分享。
          </Text>
          <Button style={{ backgroundColor: '#f97316', color: '#fff', borderRadius: 999, border: 'none' }} onClick={() => Taro.switchTab({ url: '/pages/index/index' })}>
            回首页
          </Button>
        </View>
      )
    }
    return <View style={{ padding: 40 }}><Text>加载中…</Text></View>
  }

  const steps = recipe.steps as Step[] || []

  return (
    <View style={{ minHeight: '100vh', backgroundColor: '#ffffff', paddingBottom: '100px' }}>
      {/* Hero */}
      <View style={{ width: '100%', height: '240px', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <Text style={{ fontSize: '80px' }}>{recipe.emoji || '🥘'}</Text>
        <View style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', padding: '40px 20px 20px', boxSizing: 'border-box' }}>
          <Text style={{ color: 'white', fontSize: '24px', fontWeight: '800' }}>{recipe.title}</Text>
          <View style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            {recipe.time && <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '12px', padding: '2px 8px', borderRadius: '4px' }}>{recipe.time}分钟</View>}
            {recipe.difficulty && <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '12px', padding: '2px 8px', borderRadius: '4px' }}>{recipe.difficulty}</View>}
          </View>
        </View>
      </View>

      {/* Ingredients */}
      <View style={{ padding: '24px 20px' }}>
        <Text style={{ fontSize: '18px', fontWeight: '800', color: '#1f2937', marginBottom: '16px' }}>🥕 用料清单</Text>
        <View style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {recipe.ingredients?.map((ing, idx) => (
            <View key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <Text style={{ fontSize: '14px', color: '#374151', fontWeight: '600' }}>{ing.name}</Text>
              <Text style={{ fontSize: '14px', color: '#9ca3af' }}>{ing.amount}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Steps */}
      <View style={{ padding: '0 20px 24px' }}>
        <Text style={{ fontSize: '18px', fontWeight: '800', color: '#1f2937', marginBottom: '16px' }}>👨🍳 步骤拆解</Text>
        {steps.map((step, idx) => (
          <View key={idx} style={{ marginBottom: '24px', display: 'flex', gap: '16px' }}>
            <View style={{ width: '28px', height: '28px', backgroundColor: '#0f172a', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 }}>{idx + 1}</View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: '15px', color: '#4b5563', lineHeight: '1.6' }}>{step.content}</Text>
              {step.tip && <View style={{ fontSize: '13px', color: '#f97316', backgroundColor: '#fff7ed', padding: '8px 12px', borderRadius: '6px', marginTop: '8px' }}>💡 {step.tip}</View>}
              {step.time && <Text style={{ fontSize: '12px', color: '#8e8e93', marginTop: '4px' }}>⏱️ 约 {step.time} 分钟</Text>}
            </View>
          </View>
        ))}
      </View>

      {/* Nutrition */}
      {recipe.nutritionAnalysis && (
        <View style={{ padding: '0 20px 24px' }}>
          <View style={{ backgroundColor: '#ecfdf5', padding: '16px', borderRadius: '12px' }}>
            <Text style={{ color: '#059669', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>🏃 庆爷专属营养分析</Text>
            <Text style={{ color: '#047857', fontSize: '13px', lineHeight: '1.4' }}>{recipe.nutritionAnalysis}</Text>
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={{ display: 'flex', gap: '12px', padding: '16px 20px', backgroundColor: '#f9fafb', borderTop: '1px solid #f3f4f6' }}>
        <Button style={{ flex: 1, height: '44px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '14px', backgroundColor: '#ecfdf5', color: '#059669', border: 'none' }} onClick={handleMarkCooked}>✅ 做过啦</Button>
        <Button style={{ flex: 1, height: '44px', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '14px', backgroundColor: '#eff6ff', color: '#2563eb', border: 'none' }} open-type="share">📤 分享</Button>
      </View>

      {/* Cook Button */}
      <View style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderTop: '1px solid #f3f4f6', boxSizing: 'border-box' }}>
        <Button style={{ backgroundColor: '#f97316', color: 'white', height: '50px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)', border: 'none' }} onClick={handleStartCooking}>🍽️ {steps.length > 0 ? '开始烹饪' : '暂无步骤'}</Button>
      </View>
    </View>
  )
}
