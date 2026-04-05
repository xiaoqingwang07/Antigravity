import { View, Text, Image } from '@tarojs/components'
import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'
import { D } from '../theme/designTokens'

type Props = {
  src?: string
  height: number
  borderRadius: number
  emoji?: string
  marginBottom?: number
  /** 烹饪模式用大字号提示 */
  compactHint?: boolean
}

/**
 * 步骤配图：优先远程图；加载失败或无 URL 时用渐变 + emoji 占位（小程序未配图片域名时仍有视觉锚点）
 */
export function StepFigure({ src, height, borderRadius, emoji = '🍳', marginBottom = 12, compactHint }: Props) {
  const [failed, setFailed] = useState(false)
  const trimmed = src?.trim()

  useEffect(() => {
    setFailed(false)
  }, [trimmed])

  const placeholder = (
    <View
      style={{
        width: '100%',
        height,
        borderRadius,
        marginBottom,
        background: `linear-gradient(145deg, ${D.bgElevated} 0%, ${D.separatorLight} 45%, ${D.bg} 100%)`,
        border: `0.5px solid ${D.separatorLight}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        boxSizing: 'border-box',
      }}
    >
      <Text style={{ fontSize: compactHint ? 40 : 52, lineHeight: 1 }}>{emoji}</Text>
      <Text
        style={{
          fontSize: compactHint ? 10 : 11,
          color: D.labelTertiary,
          marginTop: 8,
          textAlign: 'center',
          lineHeight: 1.4,
        }}
      >
        {failed ? '配图加载失败，以文字为准' : '步骤氛围示意'}
      </Text>
    </View>
  )

  if (!trimmed || failed) {
    return placeholder
  }

  return (
    <Image
      src={trimmed}
      mode="aspectFill"
      lazyLoad
      onError={() => setFailed(true)}
      style={
        {
          width: '100%',
          height,
          borderRadius,
          marginBottom,
          display: 'block',
          backgroundColor: D.bgElevated,
        } as CSSProperties
      }
    />
  )
}
