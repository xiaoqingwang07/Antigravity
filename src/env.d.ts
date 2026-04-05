/** Webpack defineConstants 注入，见 config/index.js */
declare const TARO_APP_MINIMAX_API_KEY: string
declare const TARO_APP_DEEPSEEK_API_KEY: string
/** 服务端 LLM 中转完整 URL，如 https://xxx.vercel.app/api/llm-proxy */
declare const TARO_APP_LLM_PROXY_URL: string
/** 可选，与中转服务 LLM_PROXY_SHARED_SECRET 一致（仍会打进包，仅作轻量门禁） */
declare const TARO_APP_LLM_PROXY_SECRET: string
