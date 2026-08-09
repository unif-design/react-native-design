# Toast/Confirm Host 栈式 lease(Host-in-Modal 修复,design 侧)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development,单 task + 任务评审(评审兼终审),TDD 先红后绿。库仓规矩以 `rn-library` + `design` skill + 根 AGENTS.md 为准。

**Goal:** 消费方(PecPortal)实证:RN `Modal` 是独立 native window,App 根的唯一 owner Host 渲染的 toast/confirm 被 Modal 物理盖住(toast 双端不可见、confirm 因 iOS 兄弟 Modal 不叠放在 iOS 不可见)。当前 first-wins 机制把「Modal 内自挂 Host」判成恒惰性死码,堵死了唯一正解。本批把 owner 机制改为**栈式接管**:后挂载的 Host 接管,卸载自动归还——Modal 内挂 Host 成为合法用法,toast/confirm 渲染进 Modal 自己的 window(confirm 的 Modal 成为嵌套 present,iOS 支持)。

**基线:** 分支 `feat/host-stacked-lease`,起点 `cef29a7`(main = 0.24.1)。发布级别 **minor**(公共行为变化:多 Host 从「警告+惰性」变「接管」),PR 标题须 `feat:` 形态,分支上须有 feat commit(verify:publish-contract 按 diff 反推)。

## Global Constraints

- 遵守 `rn-library` 任务开始清单;Toast 与 Confirm 两套 store **同构改造**(现状逐字同构,改完仍须同构)。
- TDD 先红后绿;测试形态跟随两 store 既有测试文件惯例。
- 门禁(commit 前全绿,从 repo root,只用 Yarn):`yarn install --immutable`(勿改 lock——本批零依赖变化)、`yarn lint`、`yarn typecheck`、`yarn test --maxWorkers=2`、`yarn example test`(若存在)、`yarn check:config && yarn check:runtime-peers && yarn check:jest-entries`、`yarn verify:example-showcase`、`yarn prepare`、`yarn verify:publish-contract`(如本地可跑;它要求的 release level 与 feat 对齐)。CI 侧原生构建不在本地跑。
- 同步面(rn-library「实现与联动」):源码 + barrel(公共面签名变化核)、类型测试、README/website 文档里讲「只挂一次/多个 Host 惰性」的段落、`llms.txt` 生成源、design skill 的 references 若有相应描述(skills 源仓不在本仓——**记录待同步项即可,不跨仓改**)。
- commit:conventional + 中文正文写为什么;**feat 笔**承载行为变化。零 AI 尾注(该仓若有同款守卫以仓内 lefthook/commitlint 为准,先查)。
- **不 push、不开 PR、不发布**——分支就绪即停,交用户。

### Task 1: 栈式 lease 改造(Toast + Confirm 同构)

**Files:** `src/components/ui/Confirm/store.ts` + `ConfirmHost.tsx`、`src/components/ui/Toast/store.ts` + `ToastHost.tsx`、两者测试;公共类型如 lease 签名涉及则同步。

**定稿语义(六条,实现前先读两 store 现状再落):**
1. **registerHost 压栈接管**:已有 owner 时不再拒绝——新 Host 成为当前 owner(事件从此发给它),原 owner 入栈挂起;返回正常 lease(不再返 null)。「检测到多个 Host」的 warn 删除或降 debug(多 Host 已是合法用法);单 Host 场景(绝大多数消费方)行为零变化。
2. **release 归还**:当前 owner 卸载 → 弹栈,前任恢复为 owner;栈中挂起者乱序卸载(父 Modal 关闭时子/父卸载顺序不保证)→ 从栈中移除。release 幂等(重复调无害)。
3. **owner 切换时的 in-flight 语义**:
   - **Confirm:切换(接管或归还)时,原 owner 的 active entry 一律 `resolve(false)` + 通知原 owner clear**——promise 不悬挂、单例 active 槽释放。这同时修掉消费方已知的「旧确认框占槽,新会话点确认静默无效」窄残留。
   - **Toast:切换时原 owner 收 clear,在途 toast 丢弃**(瞬态消息,接管发生在 Modal 开/关瞬间,丢弃合理;不做跨 owner 重放——过度设计)。
4. **null-owner 语义保持**:`confirm()` 调用时栈空(无任何 Host)仍按现状 warn + `resolve(false)`;toast 同。
5. **ConfirmHost/ToastHost 组件侧**:null lease 分支(inert)随「恒返 lease」死码化——同步简化组件(删 inert 态)或保留防御(签名仍容 null)——**取实现面最小且类型诚实的一种**,报告说明;组件卸载 cleanup 调 release 的既有链路保持。
6. **类型/公共面**:优先不破坏既有签名;若 lease 类型从 `X | null` 收窄为 `X`,对消费方是放宽(非 breaking),可做但在报告注明。

**红灯(每条注明现状为何红,Toast/Confirm 各一套):**
① 双 Host:后挂载者收到事件、先挂载者不收(现红:后挂载者拿 null lease 恒惰性);② 后挂载者卸载 → 事件回到先挂载者(现红:无归还机制);③ Confirm 接管时旧 active resolve(false) 且旧 owner 收 clear(现红:active 占槽直到用户点掉);④ 乱序卸载不破坏栈(父先子后/子先父后两序);⑤ 单 Host 全部既有用例保持绿(回归钉,一字不改);⑥ 栈空调用 warn+resolve(false) 保持(回归钉)。

**验收补充:** 全部既有 Toast/Confirm 测试逐字不改仍绿(单 Host 行为零变化的机器证明);`yarn prepare` 产物构建通过;文档同步面逐项核(README/website 的「只挂一次」表述改为新语义)。

### 收尾

门禁全绿 → 评审(兼终审)→ **分支就绪即停**(不 push 不 PR);`yarn pack` 出 tarball 留给 portal 批端到端验证,tarball 路径写进报告。待同步项清单(skills 源仓的 design skill 表述、消费方升级注意)写进报告交 controller。
