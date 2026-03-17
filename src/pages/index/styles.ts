/**
 * 首页样式 - 提取到组件外避免重复创建
 */

// 页面样式
export const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: '#fafafa',
  paddingBottom: '100px'
}

// 头部样式
export const headerStyle: React.CSSProperties = {
  padding: '20px'
}

export const greetingStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#8e8e93',
  marginBottom: '4px'
}

export const subtitleStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#1a1a2e'
}

// 搜索区域
export const searchSectionStyle: React.CSSProperties = {
  padding: '0 20px 20px'
}

export const searchBarStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  padding: '12px 16px',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)'
}

export const searchIconStyle: React.CSSProperties = {
  fontSize: '16px',
  marginRight: '10px'
}

export const searchInputStyle: React.CSSProperties = {
  flex: 1,
  fontSize: '15px',
  color: '#1a1a2e'
}

export const placeholderStyle: React.CSSProperties = {
  color: '#aeaeb2'
}

export const micBtnStyle: React.CSSProperties = {
  padding: '8px',
  fontSize: '18px'
}

// 历史记录
export const historyBoxStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '16px',
  margin: '0 20px 20px',
  padding: '16px',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)'
}

export const historyHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px'
}

export const historyTitleStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#374151'
}

export const clearBtnStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#8e8e93'
}

export const historyListStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px'
}

export const historyTagStyle: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
  padding: '6px 12px',
  borderRadius: '8px',
  fontSize: '13px',
  color: '#4b5563'
}

// 跑者专区
export const runnerSectionStyle: React.CSSProperties = {
  padding: '0 20px 20px'
}

export const runnerCardStyle: React.CSSProperties = {
  backgroundColor: '#1a1a2e',
  borderRadius: '20px',
  padding: '20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  overflow: 'hidden',
  position: 'relative'
}

export const runnerInfoStyle: React.CSSProperties = {
  zIndex: 1
}

export const runnerTagStyle: React.CSSProperties = {
  backgroundColor: 'rgba(249, 115, 22, 0.2)',
  color: '#f97316',
  fontSize: '12px',
  padding: '4px 10px',
  borderRadius: '6px',
  display: 'inline-block',
  marginBottom: '8px'
}

export const runnerTitleStyle: React.CSSProperties = {
  color: '#fff',
  fontSize: '20px',
  fontWeight: '700',
  marginBottom: '4px',
  display: 'block'
}

export const runnerDescStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.7)',
  fontSize: '13px'
}

// 推荐食谱
export const recipesSectionStyle: React.CSSProperties = {
  padding: '0 20px'
}

export const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px'
}

export const sectionTitleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#1a1a2e'
}

export const sectionMoreStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#8e8e93'
}

export const recipeScrollStyle: React.CSSProperties = {
  marginBottom: '20px'
}

export const recipeListStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  paddingBottom: '10px'
}

export const recipeCardStyle: React.CSSProperties = {
  width: '140px',
  backgroundColor: '#fff',
  borderRadius: '16px',
  padding: '16px',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
  flexShrink: 0
}

export const recipeEmojiBgStyle: React.CSSProperties = {
  width: '48px',
  height: '48px',
  backgroundColor: '#fff7ed',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '24px',
  marginBottom: '12px'
}

export const recipeTitleStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1a1a2e',
  marginBottom: '4px',
  display: 'block'
}

export const recipeTagStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#8e8e93'
}

// 底部操作栏
export const actionsSectionStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-around',
  padding: '20px',
  backgroundColor: '#fff',
  marginTop: '20px',
  borderTop: '1px solid #f3f4f6'
}

export const actionItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px'
}

export const actionEmojiStyle: React.CSSProperties = {
  fontSize: '28px'
}

export const actionTextStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#4b5563'
}
