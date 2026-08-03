# Runtime Image Fixture

`scripts/runtime-image-fixture.js` 是 `RuntimeApiScreen` 图片 attempt 用例的零依赖
HTTP driver。它只提供确定性的 pending / success / error / abort 计数，不代替真实
iOS、Android 与 Web 人工验收。

## 启动

在主仓根目录另开一个终端：

```sh
yarn runtime:image-fixture --host 0.0.0.0 --port 8099
```

把以下 origin 填入 runtime harness 的 `Image source identity / attempt ABA`
区域：

| 宿主 | origin |
| --- | --- |
| iOS simulator / Web | `http://127.0.0.1:8099` |
| Android emulator | `http://10.0.2.2:8099` |
| 真机 | `http://<运行 fixture 的电脑 LAN IP>:8099` |

真机必须与电脑在可互访网络内。若原生宿主的本地开发安全策略拦截 cleartext HTTP，
只为临时 harness 配置本地开发例外；不要把该配置带入库或业务 app。

每轮使用新的 `run`。屏幕上的“应用 fixture origin / 新 run”会自动递增它，多个 run
的计数与 pending response 完全隔离。

## Endpoint contract

所有响应都带 `Access-Control-Allow-Origin: *`，任意路径的 `OPTIONS` 返回 `204`。

| Endpoint | 行为 |
| --- | --- |
| `GET /status?run=N` | 返回该 run 的 request、abort、pending、release 与 forbidden 计数 |
| `GET /equivalent.png?run=N` | 保持 pending，等待显式 release |
| `POST /release-equivalent?run=N` | 让当前仍连接的 equivalent 请求返回 1×1 PNG |
| `GET /aba.png?run=N` | 第 1 请求 pending；第 2 及以后请求立即返回 1×1 PNG |
| `POST /release-a1?run=N` | A1 仍连接时返回 `500`；已 abort 时只记 `lateReleasesWithoutClient` |
| `GET /must-not-request.png?run=N` | 记 `forbiddenRequests` 并返回 `418`，用于发现非法 source 发网 |

成功图片响应的 `X-Fixture-Request-Id` 是 run 内确定性序号，例如
`equivalent-1`、`aba-2`。客户端断开和服务端 release 只允许一个 settle 路径，
不会同时计为 abort 与 release。

## 人工矩阵

### 等价 render / RNW handler identity

1. 应用新 run，等待 `equivalent.png` pending。
2. 刷新 status：`equivalent.requests=1`、`aborts=0`、`pending=1`。
3. 点击“等价 A 新对象”，再刷新 status；三项必须保持不变。
4. 点击“释放 equivalent success”：`released=1`，头像显示图片，最终
   `pending=0`、`releasedSuccesses=1`。

第 3 步会捕获 RNW 因 `onError` identity 变化而清理旧 effect、abort 并重发请求的
回归。

### A1 → B → A2 / late release

1. A1 首请求 pending，status 为 `aba.requests=1`、`pendingFirst=1`。
2. 切到 B，再切到 A2；A2 是第 2 请求并立即成功，保持图片。
3. 点击“释放 A1 late error”并刷新 status。

native 若仍保留 A1 连接，release 返回 `released=1` / `releasedErrors=1`；Web
卸载 `<Image>` 时通常会 abort A1，此时返回 `released=0` /
`lateReleasesWithoutClient=1`。Web 的 no-client 结果不能被描述成“网络触发了旧
setter”；旧 A1 handler 不能写 A2 的闭包隔离由
`__tests__/components/ui/shared/ImageAttempt.test.tsx` 独立、确定性证明。

### invalid nested source

屏幕上的 Symbol header source 必须直接 fallback。刷新 status 后
`forbiddenRequests` 必须仍为 `0`。

在真实设备 / 浏览器完成并记录可见结果与 status 前，上述人工项一律是
**BLOCKED**，不得仅凭脚本单测记为 PASS。
