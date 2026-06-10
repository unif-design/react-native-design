# src 全量代码审查报告

> 日期:2026-06-10 · 依据:`docs/specs/2026-06-10-src-code-review-design.md` · 状态:进行中
> 基线:`docs/src-code-review` @ `9c05acf`,工作区干净

## 1. 执行摘要

(Task 15 定稿时填写:整体结论、四维度概评、最值得做的 3 件事)

## 2. 发现列表

### 2.1 台账(深读期增量追加,复核后移入 2.2)

| 位置 | 维度 | 严重度 | 置信度 | 证据摘要 | 建议 |
| --- | --- | --- | --- | --- | --- |
| `scripts/build-icons.js:74` | 质量 | Low | 高(字节级复现) | Step 5 对 `src/icons/data.ts` 原始再生成 hash 变化(`8b3275e9…` → `4678ebad…`,diff ±2k 行):`build-icons.js` 输出未经 prettier 格式化(`:74` 单行拼接 `IconName` union),而提交版本按文档流程跑过 `yarn lint --fix`(prettier 拆行)。将再生成产物按仓库 prettier 配置(package.json#prettier)格式化后与 HEAD 字节一致(同为 `8b3275e9…`)→ 内容与 `src/icons/svg/` 同步,差异纯格式、再生成不幂等。任务预设「hash 变化即 High(生成物失同步)」,经上述验证证伪,降级记录;工作区已 `git checkout -- src/icons/data.ts` 还原。 | 让 `scripts/build-icons.js` 直接产出 prettier 格式(或脚本末尾调用仓内 prettier 3.8.1),使再生成幂等,`node scripts/build-icons.js && git diff --exit-code` 即可作 CI 一致性校验 |

### 2.2 定稿发现(Task 14/15 按严重度分组填入)

(移入行格式:`**位置** · 维度 · 置信度` + 证据(含关键代码片段)+ 修复建议)

#### Critical

#### High

#### Medium

#### Low

## 3. 度量数据附录

### 3.1 jscpd(重复度)

### 3.2 madge(循环依赖 / 孤儿)

### 3.3 eslint 复杂度热点

## 4. 豁免说明

(约定性同形清单 + 「基础原子」认定清单,Task 14/15 填)

## 5. 基线与前提

- 基线 commit:`9c05acf`(自 main `ff626af` / v0.8.2 拉出;其后 merge 进的 main 提交均为纯文档改动,`src/`、`scripts/` 与 ff626af 一致)
- yarn typecheck:通过(退出码 0,无报错)
- yarn test:通过(3 个 suite / 19 个用例全部通过)
- yarn lint:通过(退出码 0)
- data.ts 生成一致性:原始再生成 hash 不一致(HEAD `sha1:8b3275e9851e6e57debcffb1c450dd11689248ce` → 再生成 `sha1:4678ebadc98790ff6a0255d531efba8d1a201380`,`shasum` 即 SHA-1),但再生成产物经仓库 prettier 配置格式化后与 HEAD 字节一致 → 内容同步,差异纯格式(生成脚本输出未 prettier 化所致,详见 2.1 台账);已 `git checkout -- src/icons/data.ts` 还原,工作区恢复干净
