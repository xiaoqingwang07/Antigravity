export interface WeatherData {
  temperature: number
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy' | 'hot'
  description: string
  city: string
}

const MOCK_SCENARIOS: WeatherData[] = [
  { temperature: 5, condition: 'rainy', description: '阴雨降温', city: '上海' },
  { temperature: 8, condition: 'cloudy', description: '阴天', city: '上海' },
  { temperature: 15, condition: 'sunny', description: '晴朗舒适', city: '上海' },
  { temperature: 22, condition: 'sunny', description: '温暖宜人', city: '上海' },
  { temperature: 32, condition: 'hot', description: '高温炎热', city: '上海' },
  { temperature: -2, condition: 'snowy', description: '雨雪天气', city: '上海' },
  { temperature: 12, condition: 'windy', description: '大风降温', city: '上海' },
]

/**
 * Mock 天气 API：根据当前时间伪随机选择一个天气场景，
 * 让每次打开 app 时推荐内容有变化。
 */
export function getMockWeather(): WeatherData {
  const hour = new Date().getHours()
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const idx = (dayOfYear + hour) % MOCK_SCENARIOS.length
  return MOCK_SCENARIOS[idx]
}
