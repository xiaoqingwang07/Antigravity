# Love Kitchen（爱心厨房）代码审查报告

**文档性质**：架构与安全向静态审查汇总，便于评审、转发与排期修复。  
**审查范围**：当前仓库全量前端代码（Taro + React + TypeScript + MobX），以微信小程序交付为目标。  
**说明**：本报告基于代码阅读与微信小程序通用规范，非渗透测试或性能压测结论。

---

## 1. 执行摘要

- **内存泄漏**：未发现典型的「定时器/订阅长期未释放」类严重问题；`PantryStore` 的 `autorun` 为单例全生命周期设计，在保持单例前提下可接受。
- **主要风险**：收藏页刷新机制依赖 `eventCenter` 但无对应触发，易导致**列表不刷新**；`Result` 页异步请求**无卸载保护**；**DeepSeek 域名未配置**时真机请求失败；**API Key 存客户端**存在产品与合规层面的固有风险。
- **小程序规范**：需关注 **request 合法域名**、部分 **CSS 能力在真机上的兼容性**、上架所需的**隐私与用户协议**配置。

---

## 2. 内存与生命周期

| 编号 | 项 | 严重程度 | 说明与建议 |
|------|----|----------|------------|
| M1 | `PantryStore.autorun` 无 dispose | 低 | 单例 Store 持久化属预期。若未来按用户/会话重建 Store，须在销毁时 dispose，避免重复监听与重复写盘。 |
| M2 | 详情页烹饪计时 `setInterval` | 低 | `useEffect` 返回清理函数，卸载时会 `clearInterval`，实现合理。 |
| M3 | `Result` 页 `fetchAI` 异步 | 中 | 用户提前返回时仍可能 `setState`，建议 `useEffect` cleanup 中置 `cancelled` 标志或使用 `AbortController`。 |
| M4 | 收藏页 `eventCenter` 订阅 | 中 | 见「业务逻辑」B1：存在无效监听与错误解绑风险。 |

---

## 3. 业务逻辑与体验

| 编号 | 项 | 严重程度 | 说明与建议 |
|------|----|----------|------------|
| B1 | 收藏列表刷新 | **高** | `pages/favorites` 使用 `Taro.eventCenter.on('onShow')`，仓库内无 `trigger('onShow')`，从详情返回后列表**可能不更新**。建议改为页面 **`useDidShow`** 调用 `loadFavorites()`；并核对 `eventCenter.off` 与 `on` 的 API 是否匹配，避免监听无法移除。 |
| B2 | 库存扣减 `deductItems` | 中 | 按食材**名称精确匹配**且只扣**第一条**；无数量维度；名称不完全一致时不扣减。需在需求文档中明确为「简化模型」或后续迭代。 |
| B3 | `recipeMatch` 模糊匹配 | 中 | 子串 `includes` 可能造成**误匹配**，需在业务上接受或收紧规则。 |
| B4 | 选菜页 `initialized` 标志 | 低 | 仅首次自动勾选临期；冰箱数据变化后不再自动同步勾选，可按产品决定是否重置。 |
| B5 | 首页天气推荐含随机因子 | 低 | `getWeatherRecommendations` 打分含随机性，每次进入首页卡片可能变化；若需「当日稳定」可改为确定性种子或按日缓存。 |
| B6 | 详情非分享、无缓存时的加载态 | 低 | 无 `selectedRecipeDetail` 时可能长期「加载中…」，可补充空态/回退入口。 |
| B7 | 分享打开菜谱 | 低（已知边界） | 预埋菜可跨设备；AI 生成菜跨设备依赖本地 snapshot，**无法保证好友端一定能打开**，当前产品文案已部分说明。 |

---

## 4. 微信小程序规范与合规

| 编号 | 项 | 严重程度 | 说明与建议 |
|------|----|----------|------------|
| W1 | **request 合法域名** | **高（上线前）** | 请求 `https://api.deepseek.com` 须在小程序后台配置；`project.config.json` 中 `urlCheck: true` 时，未配置将导致真机失败。 |
| W2 | CSS 兼容性 | 中 | `linear-gradient`、`backdropFilter`、`position: fixed`、`display: grid` 等需在**目标基础库真机**上回归，避免渐变/毛玻璃/底栏异常。 |
| W3 | 分享卡片 `imageUrl` | 低 | 空串依赖微信默认图；若使用网络图须 **HTTPS** 且在允许域名内。 |
| W4 | 隐私与用户信息收集 | 中（上架） | 涉及用户输入、本地存储的 API Key 等，正式上架需按平台要求配置**用户隐私保护指引**等（以微信当前规则为准）。 |
| W5 | 仓库内 `appid` | 低 | `project.config.json` 含 AppID，公开仓库需注意**勿泄露商业号**，团队内规范替换与保密。 |

---

## 5. 安全与数据

| 编号 | 项 | 严重程度 | 说明与建议 |
|------|----|----------|------------|
| S1 | DeepSeek API Key 存 Storage | **高（架构）** | 客户端可读、可随请求发出，**不适合作为面向公众的正式方案**；正式环境建议后端代理或云函数，并做限流与密钥轮转。 |
| S2 | `pantryItems` 反序列化 | 中 | `JSON.parse` 后直接赋值，无字段校验；损坏或异常数据可能导致运行时错误。建议最小 schema 校验与降级策略。 |
| S3 | AI 返回 JSON | 低 | 已有解析与数组校验，降低白屏风险；仍依赖错误提示与兜底列表。 |

---

## 6. 架构与可维护性（摘要）

- **状态管理**：MobX 单例 + Context 清晰；详情页直接引用 `pantryStore` 与 Context 混用，风格略不统一。
- **页面间传参**：大量依赖 `Storage` 传递 `selectedRecipeDetail`，实现快但**难调试、类型弱、多页面栈时易串数据**；中长期可考虑 Store 或短 id 映射表。
- **死代码**：原 `src/pages/fridge/` 已删除，避免与 Tab「冰箱」`pantry` 混淆。

---

## 7. 修复优先级建议（供排期）

| 优先级 | 事项 |
|--------|------|
| P0 | 收藏页改为 `useDidShow` 刷新；移除或修正无效的 `eventCenter` 用法。（**已在代码中修复**） |
| P0 | 微信公众平台配置 DeepSeek **request 合法域名**；评估 API Key 是否迁出客户端。（域名由你方在后台配置；Key 策略 V1 保持现状） |
| P1 | `Result` 异步请求增加卸载取消 / mounted 标记。（**已在代码中修复**） |
| P1 | 冰箱 Storage 数据最小校验与异常降级。（**已在代码中修复**） |
| P2 | 真机验证样式与分享图；补齐隐私与合规配置；清理未使用 `fridge` 页面目录。（**fridge 目录已删除**） |

---

## 8. 附录：审查文件范围（主要）

- `src/app.ts`、`src/app.config.ts`
- `src/store/*`、`src/api/*`、`src/utils/*`
- `src/pages/index|pick|pantry|profile|result|detail|favorites/*`
- `project.config.json`、`config/*`

---

*文档随代码迭代需更新；若需二次审查（含性能/安全专项），建议单独立项。*
