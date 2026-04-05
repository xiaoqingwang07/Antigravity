#!/usr/bin/env node
/**
 * 探活 MiniMax OpenAI 兼容接口（国内：https://api.minimaxi.com/v1）
 * 读取项目根 .env.local 中 TARO_APP_MINIMAX_API_KEY，不打印密钥。
 * 用法：node scripts/smoke-minimax.mjs
 */
import fs from 'fs'
import path from 'path'
import https from 'https'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const envPath = path.join(root, '.env.local')

function loadKey() {
  if (!fs.existsSync(envPath)) {
    console.error('FAIL: 未找到 .env.local')
    process.exit(1)
  }
  const raw = fs.readFileSync(envPath, 'utf8')
  const m = raw.match(/^TARO_APP_MINIMAX_API_KEY=(.+)$/m)
  if (!m?.[1]?.trim()) {
    console.error('FAIL: .env.local 中无 TARO_APP_MINIMAX_API_KEY')
    process.exit(1)
  }
  return m[1].trim()
}

const key = loadKey()
const body = JSON.stringify({
  model: 'MiniMax-M2.7',
  messages: [{ role: 'user', content: '只回复：OK' }],
  max_tokens: 8,
})

const req = https.request(
  'https://api.minimaxi.com/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      Authorization: `Bearer ${key}`,
    },
  },
  (res) => {
    let b = ''
    res.on('data', (c) => (b += c))
    res.on('end', () => {
      console.log('HTTP', res.statusCode)
      if (res.statusCode !== 200) {
        try {
          const j = JSON.parse(b)
          console.log('body', JSON.stringify(j.error || j).slice(0, 300))
        } catch {
          console.log('body', b.slice(0, 200))
        }
        process.exit(1)
      }
      try {
        const j = JSON.parse(b)
        const ok = !!(j.choices && j.choices[0] && j.choices[0].message)
        console.log(ok ? 'OK: 返回 choices[0].message' : 'WARN: 结构异常')
      } catch {
        console.log('WARN: 无法解析 JSON')
        process.exit(1)
      }
    })
  }
)
req.on('error', (e) => {
  console.error('NET', e.message)
  process.exit(1)
})
req.write(body)
req.end()
