/**
 * Vercel Serverless：把 OpenAI 兼容的 chat/completions 请求转发到 MiniMax。
 * 环境变量（仅服务端）：
 *   MINIMAX_API_KEY — 必填
 *   LLM_PROXY_SHARED_SECRET — 可选；若设置则要求请求头 X-LLM-Proxy-Secret 一致
 *
 * 部署后将完整 URL 写入客户端构建变量 TARO_APP_LLM_PROXY_URL（如 https://xxx.vercel.app/api/llm-proxy）
 */
module.exports = async function llmProxy(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-LLM-Proxy-Secret')
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const shared = process.env.LLM_PROXY_SHARED_SECRET
  if (shared) {
    const h = req.headers['x-llm-proxy-secret']
    if (h !== shared) return res.status(403).json({ error: 'Forbidden' })
  }

  const key = process.env.MINIMAX_API_KEY
  if (!key) {
    return res.status(500).json({ error: 'MINIMAX_API_KEY is not configured' })
  }

  try {
    const r = await fetch('https://api.minimaxi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(req.body),
    })
    const text = await r.text()
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    if (process.env.LLM_PROXY_CORS !== '0') {
      res.setHeader('Access-Control-Allow-Origin', '*')
    }
    res.status(r.status).send(text)
  } catch (e) {
    res.status(502).json({ error: 'Upstream fetch failed', message: String(e && e.message ? e.message : e) })
  }
}
