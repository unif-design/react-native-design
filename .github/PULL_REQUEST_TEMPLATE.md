## 变更概述

<!-- 1-2 句:做了什么 / 为什么。链接 issue 用 `Closes #N`。 -->

## 类型

<!-- conventional-commits 类型,跟 commit msg 对齐。多选用 - [x] -->

- [ ] `feat` 新功能(会触发 minor 发版)
- [ ] `fix` Bug 修复(会触发 patch 发版)
- [ ] `refactor` / `chore` / `docs` / `test` / `ci`(不发版)
- [ ] **包含 BREAKING CHANGE**(会触发 major 发版,在 commit body 写 `BREAKING CHANGE: ...`)

## 验证

- [ ] `yarn lint`
- [ ] `yarn typecheck`
- [ ] `yarn test`
- [ ] (若改了 RN 组件)在 `example/` 里跑过,亮 + 暗主题都看了
- [ ] (若加了 icon)`node scripts/build-icons.js` 已跑、`data.ts` 已更新

## 影响范围 / 注意点

<!-- 用了哪些 token / 哪些组件受影响 / 消费者(portal)是否需要同步改动 -->
