# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Taste Lab (爱心厨房) — a Taro + React + TypeScript WeChat Mini Program / H5 web app for AI-powered recipe recommendations. Frontend-only; no backend or database.

### Dev server

- `npm run dev:h5` starts the Webpack dev server on **port 10086** (H5 mode).
- The app is served at `http://localhost:10086/`.
- There is no lint or test script configured in `package.json`. The project uses TypeScript but has no dedicated `tsc --noEmit` check or ESLint setup.

### Build

- `npm run build:h5` produces a production build in `dist/`.

### Gotchas

- The project uses `package-lock.json` (npm). Do **not** use pnpm or yarn.
- Taro design width is 750 (`config/index.js`). Styles use `px` values at 750-width scale; Taro auto-converts for H5.
- The app calls the DeepSeek API directly from the frontend (`Taro.request`). An API key is embedded in source code. If the API is unreachable, the result page still renders with mock/fallback data.
- HMR warning (`[ReactRefreshPlugin] Hot Module Replacement (HMR) is not enabled!`) during `dev:h5` is benign and can be ignored.
- Webpack build warnings about asset size limits and `webpackExports` are expected and harmless.
