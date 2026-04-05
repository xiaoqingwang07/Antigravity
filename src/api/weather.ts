import Taro from '@tarojs/taro'

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

/** 上海人民广场 — 定位失败时使用 */
const DEFAULT_LAT = 31.2304
const DEFAULT_LON = 121.4737

function mapWmoToCondition(code: number, tempC: number): WeatherData['condition'] {
  if (tempC >= 30) return 'hot'
  if (code >= 95) return 'rainy'
  if (code >= 71 && code <= 77) return 'snowy'
  if (code >= 51 && code <= 67) return 'rainy'
  if (code >= 80 && code <= 82) return 'rainy'
  if (code >= 45 && code <= 48) return 'cloudy'
  if (code >= 1 && code <= 3) return 'cloudy'
  if (code === 0) return 'sunny'
  return 'cloudy'
}

function describeWeather(condition: WeatherData['condition'], tempC: number, city: string): string {
  const t = `${Math.round(tempC)}°C`
  if (condition === 'rainy') return `${city} ${t} 有降水感，暖胃菜更合适`
  if (condition === 'snowy') return `${city} ${t} 偏冷，来点热乎的`
  if (condition === 'hot') return `${city} ${t} 炎热，清爽快手更好`
  if (condition === 'sunny') return `${city} ${t} 晴好，吃得舒服最重要`
  return `${city} ${t} 天气一般，家常最稳`
}

/**
 * 使用 Open-Meteo（无需 API Key）+ 可选定位。
 * 小程序需在后台配置 request 合法域名：https://api.open-meteo.com
 */
export async function fetchLiveWeather(): Promise<WeatherData | null> {
  let lat = DEFAULT_LAT
  let lon = DEFAULT_LON
  let city = '上海（默认）'

  try {
    const loc = await Taro.getLocation({ type: 'gcj02' })
    if (loc?.latitude != null && loc?.longitude != null) {
      lat = loc.latitude
      lon = loc.longitude
      city = '当前位置'
    }
  } catch {
    /* 用户拒绝定位或未授权 — 用默认坐标 */
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
    const res = await Taro.request<{ current?: { temperature_2m?: number; weather_code?: number } }>({
      url,
      timeout: 10000,
    })
    if (res.statusCode !== 200 || !res.data?.current) return null
    const temp = Number(res.data.current.temperature_2m)
    const code = Number(res.data.current.weather_code ?? 0)
    if (!Number.isFinite(temp)) return null
    const condition = mapWmoToCondition(code, temp)
    return {
      temperature: Math.round(temp),
      condition,
      description: describeWeather(condition, temp, city),
      city,
    }
  } catch {
    return null
  }
}

/**
 * 与历史逻辑兼容：无网络/无定位时的本地伪随机场景
 */
export function getMockWeather(): WeatherData {
  const hour = new Date().getHours()
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  const idx = (dayOfYear + hour) % MOCK_SCENARIOS.length
  return MOCK_SCENARIOS[idx]
}
