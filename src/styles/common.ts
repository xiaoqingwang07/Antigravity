/**
 * 通用样式 - 跨页面复用
 */
import type { CSSProperties } from 'react'
import { D } from '../theme/designTokens'

// ============ 卡片样式 ============
export const cardStyle: CSSProperties = {
  backgroundColor: D.bgElevated,
  borderRadius: D.radiusL,
  padding: '18px',
  border: `0.5px solid ${D.separatorLight}`,
  boxShadow: D.shadowCard,
}

export const cardRowStyle: CSSProperties = {
  ...cardStyle,
  display: 'flex',
  alignItems: 'center',
  gap: '14px'
}

// ============ 图片盒子 ============
export const emojiBoxStyle: CSSProperties = {
  width: '72px',
  height: '72px',
  backgroundColor: D.bg,
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '36px',
  flexShrink: 0
}

export const emojiBoxSmallStyle: CSSProperties = {
  ...emojiBoxStyle,
  width: '64px',
  height: '64px',
  fontSize: '32px',
  overflow: 'hidden',
}

// ============ 文字样式 ============
export const titleStyle: CSSProperties = {
  fontSize: '17px',
  fontWeight: '600',
  color: D.label,
  marginBottom: '4px'
}

export const titleLargeStyle: CSSProperties = {
  fontSize: '28px',
  fontWeight: '700',
  color: D.label,
  marginBottom: '6px',
  letterSpacing: '-0.03em',
}

export const subtitleStyle: CSSProperties = {
  fontSize: '13px',
  color: D.labelSecondary
}

export const quoteStyle: CSSProperties = {
  fontSize: '13px',
  color: D.accentWarm,
  fontStyle: 'italic',
  marginBottom: '8px'
}

export const textMutedStyle: CSSProperties = {
  fontSize: '13px',
  color: D.labelTertiary
}

// ============ 标签样式 ============
export const tagStyle: CSSProperties = {
  fontSize: '12px',
  color: '#8e8e93',
  backgroundColor: '#f3f4f6',
  padding: '2px 8px',
  borderRadius: '4px'
}

export const ratingBadgeStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '3px',
  backgroundColor: '#fffbeb',
  padding: '2px 8px',
  borderRadius: '6px'
}

// ============ 页面容器 ============
export const pageStyle: CSSProperties = {
  minHeight: '100vh',
  backgroundColor: D.bg,
  padding: `12px ${D.pagePadH}px`,
  paddingBottom: '40px'
}

export const pageWithHeaderStyle: CSSProperties = {
  ...pageStyle,
  paddingTop: '0'
}

// ============ 空状态 ============
export const emptyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  paddingTop: '100px'
}

export const emptyEmojiStyle: CSSProperties = {
  fontSize: '64px',
  marginBottom: '20px'
}

export const emptyTitleStyle: CSSProperties = {
  fontSize: '18px',
  fontWeight: '600',
  color: D.label,
  marginBottom: '8px'
}

export const emptyDescStyle: CSSProperties = {
  fontSize: '14px',
  color: D.labelTertiary,
  textAlign: 'center'
}

// ============ 加载状态 ============
export const loadingStyle: CSSProperties = {
  height: '60vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column'
}

export const loadingEmojiStyle: CSSProperties = {
  fontSize: '48px',
  marginBottom: '16px'
}

export const loadingTextStyle: CSSProperties = {
  color: '#8e8e93',
  fontSize: '15px',
  fontWeight: '500'
}

// ============ 错误提示 ============
export const errorBoxStyle: CSSProperties = {
  backgroundColor: '#fff7ed',
  borderRadius: '12px',
  padding: '14px 16px',
  marginBottom: '16px',
  borderLeft: '3px solid #ff9a56'
}

export const errorTextStyle: CSSProperties = {
  fontSize: '14px',
  color: '#ea580c'
}

// ============ 列表样式 ============
export const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px'
}

// ============ 信息行 ============
export const metaRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  flexWrap: 'wrap' as const
}

// ============ 头部 ============
export const headerStyle: CSSProperties = {
  marginBottom: '20px'
}

export const headerLargeStyle: CSSProperties = {
  marginBottom: '24px'
}
