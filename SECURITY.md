# 安全与上线检查

## LLM API Key

- **不要**把真实 `TARO_APP_MINIMAX_API_KEY` 提交到 Git，也不要打进可公开发布的构建产物。
- **推荐**：部署根目录 `api/llm-proxy.js`（Vercel Serverless），在平台环境变量中配置 `MINIMAX_API_KEY`；客户端仅配置 `TARO_APP_LLM_PROXY_URL` 指向 `https://<项目>.vercel.app/api/llm-proxy`。
- **可选**：在 Vercel 设置 `LLM_PROXY_SHARED_SECRET`，并在本地 `.env.local` 配置同名值的 `TARO_APP_LLM_PROXY_SECRET`（仍会进入前端包，仅作轻量门禁；更强方案请用登录态或 Cloudflare Access）。

## 微信小程序

- 使用服务端中转时，在[微信公众平台](https://mp.weixin.qq.com) → 开发 → 开发管理 → 服务器域名 → **request 合法域名** 中加入你的中转域名（如 `https://xxx.vercel.app`）。
- 未使用中转、直连 MiniMax 时，需添加 `https://api.minimaxi.com`。

## 模型返回数据

- 客户端对 LLM 返回的菜谱 JSON 使用 Zod 校验（`src/schemas/recipeLlm.ts`），校验失败会触发结果页的本地/缓存兜底，避免白屏。
