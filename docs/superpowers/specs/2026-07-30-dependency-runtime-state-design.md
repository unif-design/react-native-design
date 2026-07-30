# 依赖与 Runtime 状态设计

> 日期：2026-07-30
>
> 父设计：[全量整改总览](./2026-07-30-runtime-api-full-remediation-design.md)
>
> 状态：设计已确认，待书面审阅

## 1. 范围

本专项处理：

- RNGH、RNRC、Reanimated、Worklets 的兼容矩阵。
- `confirm()` / `ConfirmHost` 的 Promise 生命周期。
- `toast()` / `ToastHost` 的挂载前消息和多 Host 行为。
- Pulse、PulseDot、Skeleton 使用的动画参数归一化。
- 为上述动画及后续 Switch/Carousel 提前实现 Theme 设计中的跨平台 `usePrefersReducedMotion` 前置。

除 `usePrefersReducedMotion` 这一明确前置外，不处理其他输入组件、Theme 或 Icons 实现。每项公共依赖/行为修改在自己的原子实施提交中同步对应 Website MDX、README 和测试；最终 Website 专项只做全量审计与生成，不能把同步延后。

## 2. 依赖升级

### 2.1 直接依赖与 peer contract

根包 `devDependencies` 及 Website `dependencies`：

```text
react-native: 0.86.2
react-native-gesture-handler: ^3.1.0
react-native-reanimated-carousel: ^5.0.0
react-native-reanimated: ~4.5.3
react-native-worklets: ^0.11.3
```

根包继续精确使用 `react@19.2.3`；Website 的 `react` / `react-dom` 从 `^19.2.0` 提高到 `^19.2.3`。根包中与 RN 绑定的 `@react-native/babel-preset`、`@react-native/eslint-config`、`@react-native/jest-preset` 同步改为 `0.86.2`，不得保留 0.85 工具链与 0.86 runtime 混搭。

根包和 Website 的 `engines.node` 同步设为：

```text
^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0
```

该范围逐字采用 RN `0.86.2` 的发布 metadata；现有 `.nvmrc` `24.13.0` 已满足，不为本轮改动。不得继续保留 Website 的宽泛 `>=18.0`，否则安装声明与实际 RN toolchain 冲突。

根包发布 peers：

```text
react: >=19.2.3 <20.0.0
react-native: >=0.86.0 <0.87.0
react-native-gesture-handler: >=3.0.0 <4.0.0
react-native-reanimated-carousel: >=5.0.0 <6.0.0
react-native-reanimated: >=4.5.2 <4.6.0
react-native-worklets: >=0.11.0 <0.12.0
```

决策依据：

- 当前直接验证平台升级为 React Native `0.86.2` 与 React `19.2.3`。RN `0.86.2` 的发布 peer 要求 React `^19.2.3`；本库发布 peer 从 `*` 收窄为 RN `0.86.x` / React 19（下限 `19.2.3`），与 README 的实际支持声明一致，且不暗示 RN `0.87+` 或 React 20 可用。
- 库公开支持 RNGH 3 全系列，因此 peer 下限包含已验证可用的 `3.0.0`。
- Worklets `0.11.x` 与 Reanimated `4.5.2+` 配套；Reanimated `4.5.0` / `4.5.1` 的发布 peer metadata 只接受 Worklets `0.10.x`，因此发布 peer 下限不能写成 `4.5.0`。
- Reanimated `4.5.3` 与 Worklets `0.11.3` 的发布 RN peer 都是 `0.83 - 0.86`，按 semver 覆盖完整 RN `0.86.x`，因此包含 `0.86.2`。
- 二者必须在同一次依赖修改中升级和锁定。Reanimated 使用 `~4.5.3`，避免普通安装更新自动越到尚未纳入本 contract 的 `4.6`；Worklets 的 `^0.11.3` 按 0.x semver 只允许 `<0.12.0`。
- 不扩大到尚未验证的 Reanimated `4.6` 或 Worklets `0.12`。
- `example/` 不在本轮范围内，不同步修改。

### 2.2 Worklets 工具链 peer provider

Worklets 0.11.3 还声明 `@babel/core` 和 `@react-native/metro-config` peers。为使每个实际提供 Worklets 的 workspace 自洽：

- 根 `devDependencies` 增加 `@babel/core@^7.29.7`，以及与 RN 0.86.2 精确同版本的 `@react-native/metro-config@0.86.2`。
- Website `devDependencies` 同样直接提供这两项；`@babel/core` 同时满足现有 `@babel/preset-flow`。
- 不把这两个仅用于构建/Metro 的包加入本设计库发布 peers，因为库运行时代码不导入它们；消费方安装说明明确其 RN 工具链必须满足 Worklets 自己的 peer contract。
- `example/` 不因本轮修改；最终只核对其既有 provider，不改文件。

### 2.3 RN 0.86.2 原生验证工具

根 `devDependencies` 以精确版本加入：

```text
@react-native-community/cli: 20.1.0
@react-native-community/template: 0.86.2
```

`@react-native-community/template@0.86.2` 的官方 manifest 本身将生成工程的 CLI 固定为 `20.1.0`，并把 React/RN 固定为 `19.2.3` / `0.86.2`；因此本仓复用这组配对，不采用浮动的 `@latest` 或另猜 CLI 版本。两项只用于总览定义的临时 native harness，不进入发布 peers，也不加入 Website。

`scripts/create-runtime-api-harness.js` 调用本地 `rnc-cli`，同时传入 RN `0.86.2` 与已安装 template 的绝对本地路径。运行前必须校验两个包的精确版本、template manifest 中的 React/RN、以及 `yarn.lock` 中对应 checksum；展开后再校验生成 manifest 与关键 native/toolchain 文件，任一不一致立即失败。这样 scaffold 的来源由当前 immutable install 决定，不能因 registry `latest` 漂移。

### 2.4 RNRC metadata 修正

RNRC 5.0.0 发布 metadata 仍把 RNGH 限制为 `<3.0.0`，与本项目已验证组合不符。原始冲突为：

```text
react-native-reanimated-carousel@5.0.0
  requests react-native-gesture-handler >=2.9.0 <3.0.0
project
  provides react-native-gesture-handler 3.x
```

Yarn 4 没有在项目配置中重写已存在 peer range 的机制（见官方 [packageExtensions](https://yarnpkg.com/configuration/yarnrc/#packageExtensions) 与 [patch limitations](https://yarnpkg.com/features/patching#limitations)）：

- `packageExtensions` 只能增加缺失项，不能覆盖原始 peer。
- `patch:` 在 fetch 阶段应用，此时依赖已经完成 resolution；修改被 patch 包的 `package.json` 不能改变 peer 校验。
- `resolutions` 能选择 locator/version，但不能重写某个已发布包声明的 peer request。

因此不提交无效 metadata patch、不 fork/vendor 第三方源码，也不把该 peer 标成 optional。采用“窄过滤 + 独立严格审计”：

1. `.yarnrc.yml` 只过滤同时命中以下条件的安装日志：provider 名为 `react-native-gesture-handler`、实际版本为 3.x、requester 包含 `react-native-reanimated-carousel`。不能按整个 `YN0060` code 过滤，也不能吞掉其他包或其他 major 的 peer warning。
2. 新增 `scripts/check-runtime-peers.js` 和根命令 `yarn check:runtime-peers`。脚本读取 `yarn explain peer-requirements` 的全部失败项并逐个展开；四个 runtime 包相关的失败只允许当前已验证例外：RNRC 精确为 5.0.0、其 RNGH request 精确为 `>=2.9.0 <3.0.0`、provider 为 3.x，且同一 requirement 中其余 requester range 均满足 provider。
3. checker 遇到 RNRC 版本/range、RNGH major、requester 集合或其他 runtime peer 失败的任何变化都退出非零，不能因日志已过滤而静默放行。
4. checker 成功时仍明确打印一条 `KNOWN_EXCEPTION` 摘要，使审计结果可见；它不是把错误伪装为完全不存在。
5. 上游发布支持 RNGH 3 的正确 metadata 后，升级 RNRC，并在同一变更删除窄 log filter 和 checker allowlist；删除后必须由 checker 证明四个 runtime 包零失败项。

根与 Website 各自形成的 peer requirement 都必须被 checker 覆盖。`yarn install --immutable` 不再显示这两条已验证的 RNRC/RNGH 误报；`yarn check:runtime-peers` 则保留对该例外和其他 runtime peer 的严格可见审计。

README、Getting Started 和 `skills/design/` 必须把平台要求写成 RN `0.86.x` + React 19（`>=19.2.3 <20.0.0`）及上述 Node engine range，并注明：本库的 Yarn filter 不随 npm 包传播。使用 RNRC 5.0.0 + RNGH 3 的消费仓库在上游修复前，只能使用其包管理器支持的**精确** peer allowlist/filter 或接受该条 warning；不得建议全局忽略 peer dependency，也不能误称 `packageExtensions` / `patch:` 已改写 metadata。

## 3. Confirm 状态机

### 3.1 Store 数据模型

每次成功创建 Confirm 请求时生成一个单调递增 `id`。最终内部协议为：

```ts
type ConfirmEntry = {
  id: number;
  options: Readonly<ConfirmOptions>;
  settled: boolean;
  resolve: (result: boolean) => void;
};

type ConfirmEvent =
  | { type: 'show'; entry: ConfirmEntry }
  | { type: 'clear'; id: number };

type ConfirmSubscriber = (event: ConfirmEvent) => void;
```

Host 从 `entry.options` 读取 title/message/actions，不再使用 flattened entry。Store 同时最多有一个 `activeEntry`。重入继续保持当前语义：当已有 active entry 时，新 `confirm()` 立即返回 `Promise.resolve(false)`，不替换现有对话框。

### 3.2 创建和无 Host 路径

`confirm(options)` 的顺序固定为：

1. 检查是否已有 active entry；有则立即返回 `false`。
2. 检查是否存在合法 Host owner；没有则开发环境告警并立即返回 `false`。
3. 创建 Promise 和 entry，写入 `activeEntry`。
4. 同步通知唯一 subscriber。

无 Host 时不创建 entry、不保存 resolver，也不返回永不结束的 Promise。

Promise executor 只捕获 resolver，不在 executor 内调用 subscriber。同步投递使用显式 `try/catch`：

- subscriber 抛错时记录内部错误。
- 对刚创建且仍 active 的 entry 执行 `settle(entry, false)`。
- 返回的 Promise 必须 resolve `false`，不能变成 rejected Promise。
- active entry 必须清空，后续 `confirm()` 仍可正常创建请求。
- 抛错的 subscriber/owner registration 失效，避免后续请求持续投递给已损坏 Host。

### 3.3 唯一 settle 入口

确认、取消、backdrop、系统返回、Host cleanup 都必须调用同一个：

```ts
settle(entry, result);
```

只有同时满足以下条件才允许执行：

- `entry.settled === false`；
- `activeEntry === entry`。

成功 settle 的顺序固定为：

1. 设置 `entry.settled = true`；
2. 仅在 identity 仍匹配时清空 `activeEntry`；
3. 调用一次 resolver；
4. 向仍有效的 owner 发送 `{ type: 'clear', id: entry.id }`。

Host 只在 `pendingRef.current?.id === event.id` 时同步清空 ref 和 UI state。重复事件、旧动画回调和迟到 cleanup 都成为无操作，不能清除或 resolve 后创建的 entry。

### 3.4 Host 生命周期与 ownership

Host subscriber 收到 entry 时，必须先同步写入 `pendingRef`，再调用 React `setState`。如果组件在 commit 前卸载，cleanup 仍能取得并 settle 自己持有的 active entry。

模块只允许一个 Host owner：

- 第一个注册成功的 Host 成为 owner 并获得 subscriber。
- 第二个 Host 不订阅、不渲染共享 entry，并在开发环境通过 `createLogger` 报告配置错误。
- owner cleanup 时先取消订阅，再对自己仍持有且仍 active 的 entry 执行 `settle(entry, false)`，最后释放 owner。
- 非 owner cleanup 不能影响 owner 或 active entry。
- 已挂载但注册失败的重复 Host 在本次 mount 生命周期永久 inert；首 owner 卸载后不会自动接管，只有显式 remount 才能重新注册。

ownership 使用模块内 opaque token，不依赖 React 组件实例比较。

`settle` 的 UI 清空通知也位于异常边界内：entry 和 Promise 先进入最终状态；随后 subscriber 即使抛错，也只能记录错误并使该 owner 失效，不能回滚 settle。

## 4. Toast 状态机

### 4.1 latest-wins pending

Store 在 `pendingEntry` 与 `delivered` 之间合计最多保存一条逻辑 entry：

- 没有 Host 时，新 entry 覆盖旧 `pendingEntry`。
- 有合法 owner 时，新 entry 替换旧 delivery，并立即以新的 delivery lease 投递给 Host。
- 第一个 Host 注册时，通过下述 CAS 事务把 pending 移入 delivery；subscriber 抛错时再恢复，不使用“回调返回后无条件清 pending”。
- Host 完成退场后调用 `complete(ownerToken, leaseId, entryId)`；三个 identity 都等于当前 delivery 才允许清空。
- owner cleanup 时，尚未 complete 的 delivery 对应逻辑 entry 移回 pending，再释放 owner；下一个合法 Host 会以**新的** lease 重新展示它。

这保证启动阶段只展示最后一条 toast，不创建无界队列。

每次向 owner 投递都生成单调递增 `leaseId`，包括同一个 entry 从 owner A cleanup 后被 owner B 重投。Store 保存：

```ts
type ToastDelivery = {
  entry: ToastEntry;
  ownerToken: symbol;
  leaseId: number;
};
```

entry id 标识逻辑消息，lease id 标识一次具体投递；二者不能互相替代。

每次同步投递都使用同一 `beginDelivery(entry, ownerToken)` 事务：

1. 生成新 lease，把当前逻辑 entry 从 pending 原子移动到 `delivered={entry, ownerToken, leaseId}`；调用 subscriber 前 Store 中只由 delivery 持有它。
2. 调用 subscriber；允许 subscriber 同步重入 `toast()`、owner cleanup、注册新 owner 或完成当前 delivery。
3. subscriber 正常返回时不做无条件清理；只有当前 owner/delivery 仍等于捕获的 token/lease/entry 时，才确认该 delivery 继续有效。重入产生的新状态原样保留。
4. subscriber 抛错时先按 owner token CAS：若捕获 owner 已 cleanup 或被新 owner 替代，外层异常不再修改 Store；若捕获 owner 仍是 current owner，则无条件使该坏 owner 失效，并把**该 owner 当前最新 delivery** 的 entry 原子移回 pending 后清除 delivery。当前 delivery 可以是重入产生的 B，不要求仍是原 lease A。
5. 若同 owner 的当前 delivery 已被 `complete` 且没有更新 delivery，只失效 owner，不复活已完成的原 entry。只有当前 delivery 仍是捕获的原三重 identity 时，回存的才是原 entry。

这是一条 compare-and-swap 规则，不依赖 JavaScript 调用“通常不重入”的假设。特别是 subscriber 处理 A 时调用 `toast(B)`，外层 A 无论随后成功还是抛错，都不能清除或覆盖 B。

Host 挂载前调用 Toast 是支持场景，不告警；它与 Confirm 的“无 Host 立即返回 false”语义不同，因此两者不抽象成一个泛型 Store。

### 4.2 ownership 与陈旧回调

Toast 采用与 Confirm 相同的唯一 owner 原则：

- 第一个 Host 订阅。
- 重复 Host 不订阅，开发环境记录错误。
- 重复 Host 在本次 mount 生命周期永久 inert，不自动晋升。
- owner cleanup 先同步清空自己的 `currentDeliveryRef`，再清理 timer、RAF、native animation，最后携带 owner token 与 lease 释放 delivery 并按上一节回存未完成 entry。

每条 toast 都有递增 entry id，每次投递都有递增 lease id。Host subscriber 收到 delivery 时，先同步更新 `currentDeliveryRef={ ownerToken, leaseId, entryId }` 并取消旧 timer/RAF/animation，再触发 React state。native dismiss 动画回调、Web transition cleanup 和 timer 在修改 opacity、translate、visible 或 entry state**之前**，都必须确认捕获的三元 identity 仍等于同步 ref 和 Store 当前 delivery。旧 entry 的回调不能让新 toast 短暂隐藏；旧 owner 对同一 entry 的旧 lease 也不能完成新 owner 的重投。

所有 timer、animation callback 和 Web effect cleanup 都必须可取消；清理动作本身也要幂等。

Toast 投递采用“原子移动、失败时 CAS 恢复”：

- subscriber 调用前 entry 已从 pending 移入具体 lease，Store 不同时保存两份逻辑消息。
- subscriber 抛错时记录错误；捕获 owner 仍为 current 时必须失效它，并把该 owner 当前最新 delivery 回存 pending。owner 已换代时不碰新 owner；原 delivery 已完成且没有更新 delivery 时不复活旧 entry。
- 后续合法 Host 可以重新注册并 drain；若期间有新 toast，仍按 latest-wins 覆盖旧 pending。

## 5. Pulse 参数归一化

新增共享纯函数 `normalizePulseOptions(input, defaults)`，native 和 Web hook 都只消费归一化结果，Pulse、PulseDot、Skeleton 不各自执行数值判断。纯函数返回归一化值、`isStatic` 和字段诊断，不直接记录日志。

归一化规则：

| 字段       | 有效域                       | 非法值回退              |
| ---------- | ---------------------------- | ----------------------- |
| `duration` | 有限数且 `1 <= value < 2^31` | `700`                   |
| `delay`    | 有限数且 `0 <= value < 2^31` | `0`                     |
| `from`     | 有限数且 `0 <= value <= 1`   | 组件 defaults 的 `from` |
| `to`       | 有限数且 `0 <= value <= 1`   | 组件 defaults 的 `to`   |

规则补充：

- 基础 Pulse defaults 为 `{ duration: 700, delay: 0, from: 0.6, to: 1 }`；PulseDot 与 Skeleton 保留现有 `from: 0.5`，并把该值作为自身非法输入 fallback。
- 不对合法数值做隐式取整或 clamp；越界和 `NaN`/`Infinity` 统一视为非法。
- `from === to` 是合法静态配置，`isStatic=true`，不创建 interval/repeat。`from > to` 也是合法反向 pulse；文档改称“起始/目标透明度”，不再误称下界/上界。
- platform hook 在 effect 边界读取诊断；仅在显式 `__DEV__` guard 内通过组件级 logger 告警，生产环境静默使用安全默认值。
- Web `setInterval` 和 native Reanimated timing 都不得再直接读取未经校验的公开 prop。
- 依赖升级后立即按 Theme 设计 §2.4 完成 `usePrefersReducedMotion` 前置（native 内部委托 Reanimated `useReducedMotion`，Web 使用 `matchMedia`），再实现 Pulse。后续 Input 专项直接消费这份已验证实现；reduced motion 下 Pulse 不启动循环，静态保持归一化后的 `to`。

## 6. 错误处理

- 重复 Host 属于开发配置错误：第二个 Host 被拒绝，但不让生产应用崩溃。
- Confirm 无 Host 属于调用错误：立即 `false`，开发环境告警。
- Toast 无 Host 属于支持的启动时序：只缓存最新一条，不告警。
- 用户提供的动画数值非法时安全回退；不得制造 0ms timer render storm。
- subscriber 异常必须回到上述确定性安全状态：Confirm resolve `false`，Toast 保留 latest pending；两者都不得遗留坏 owner。

## 7. 测试

只测试提取后的纯 Store/归一化逻辑，不新增 Host 组件 snapshot：

- Confirm 重入返回 `false`。
- Confirm 无 Host 返回 `false` 且不创建 active entry。
- Confirm subscriber 抛错时 resolve `false`、清空 active、释放坏 owner，Promise 不 reject。
- 同一 entry 重复 settle 只 resolve 一次。
- 旧 entry settle/cleanup 不影响新 active entry。
- owner 与重复 Host 的注册、释放和非 owner cleanup。
- Toast 无 Host时 latest-wins。
- 首个 owner 原子 drain pending，第二个 owner 取不到同一 entry。
- Toast subscriber 抛错时保留 pending 并允许新 owner 重试。
- Toast subscriber 处理 A 时同步创建 B：A 随后成功或抛错都不能清除/覆盖 B；subscriber 内 owner cleanup 后，外层 success 也不能清除刚回存的 entry。
- A subscriber 成功投递 B 后 A 抛错：旧 owner 失效，B 成为 pending；A 在回调内先 `complete(A)` 再抛错：owner 失效，但 A 不复活。
- 旧 toast timer/RAF/动画回调在新 entry commit 前后都不能修改新 entry 的可见状态或完成它。
- Toast owner cleanup 把未完成 entry 放回 pending；被拒绝 Host 不自动晋升。
- 同一 entry 从 owner A cleanup 后由 owner B 以新 lease 重投时，A 已排队且无法取消的 callback/`complete` 也不能影响 B。
- Pulse 四个字段的边界、`NaN`、正负 `Infinity`、组件 defaults、相等静态值和反向值。
- `shouldAnimatePulse(normalized, reducedMotion)` 对 Web/native 共用判断；静态或 reduced motion 不创建 repeat/interval。

## 8. 验收标准

- React/RN/Node 平台 contract、RN 绑定工具链、四个 runtime 依赖的直接版本、peer range 和 lockfile 完全一致；README、Getting Started 与 Skill 只声明 RN `0.86.x` 和精确 Node engine range，不再保留 `0.85+`、Node `>=18` 或其他无上限写法。
- 临时 native harness 只使用 lockfile 中的 `@react-native-community/cli@20.1.0` 与 `@react-native-community/template@0.86.2`，生成结果经双重版本断言后再安装和构建，不读取 `example/`，不依赖浮动 registry tag。
- 根与 Website 明确提供 Worklets 的 Babel/Metro peers；`yarn install --immutable` 不再显示 RNRC/RNGH 的已验证误报，`yarn check:runtime-peers` 明确报告且只允许该已知例外。
- Confirm 的每个 Promise 在所有 Host 生命周期路径有且仅有一次 settle。
- 任何旧 Confirm entry 都不能清除或 resolve 新 entry。
- Host effect 前调用 Toast，首个 Host 挂载后能展示最后一条消息。
- 同一 Store 不会被两个 Host 同时消费。
- Pulse 的非法 duration 不会形成高频 timer，reduced motion 不启动动画。
