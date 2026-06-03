---
sidebar_position: 8
title: 全局 Don'ts
description: "Unif Design 硬性禁忌清单：不引入新渐变 / 蓝色装饰 / 装饰 emoji / 英文 UI / 新字体；不破坏气泡内角方；不用 border-bottom；不硬编码 token；动效仅 fade + layout。"
---

# 全局 Don'ts

硬性禁忌。违反这些会破坏品牌一致性。每条都对应一条[设计原则](/docs/design/principles)或 token 规则,载入即生效(load-bearing)。

<div className="unif-donts">
  <div className="unif-dont">
    <div className="unif-dont__x">×</div>
    <div><strong>不要</strong>引入新的渐变色。仅保留品牌橙 135° 渐变(Logo 圆 / Drawer header)。</div>
  </div>
  <div className="unif-dont">
    <div className="unif-dont__x">×</div>
    <div><strong>不要</strong>添加紫色 / 蓝色装饰。蓝色 <code>c.info</code>(<code>#3775F6</code>)<em>专属</em>于用户头像(及 Tag info variant 历史沿用)。</div>
  </div>
  <div className="unif-dont">
    <div className="unif-dont__x">×</div>
    <div><strong>不要</strong>在 UI 文案中使用装饰 emoji(包括国旗、表情)。功能性状态走图标。</div>
  </div>
  <div className="unif-dont">
    <div className="unif-dont__x">×</div>
    <div><strong>不要</strong>写英文 UI 文案,除非用户明确要求。出货语言是简体中文。</div>
  </div>
  <div className="unif-dont">
    <div className="unif-dont__x">×</div>
    <div><strong>不要</strong>引入新字体。系统栈 + PingFang SC 是全部字体系统,不加 webfont。</div>
  </div>
  <div className="unif-dont">
    <div className="unif-dont__x">×</div>
    <div><strong>不要</strong>违反气泡的非对称圆角规则。"指向头像的内角是直角"是核心标识。</div>
  </div>
  <div className="unif-dont">
    <div className="unif-dont__x">×</div>
    <div><strong>不要</strong>在列表行使用 <code>border-bottom</code>。用白卡 + 8px gap + 浅灰底分组(<code>&lt;List&gt;</code> grouped 默认)。</div>
  </div>
  <div className="unif-dont">
    <div className="unif-dont__x">×</div>
    <div><strong>不要</strong>引入插画、装饰图形、卡通元素。视觉是功能性的、克制的。</div>
  </div>
  <div className="unif-dont">
    <div className="unif-dont__x">×</div>
    <div><strong>不要</strong>在头像里放图片或多于 1 个字符。所有头像都是单字符 monogram。</div>
  </div>
  <div className="unif-dont">
    <div className="unif-dont__x">×</div>
    <div><strong>不要</strong>硬编码颜色 / 字号 / 间距值。从 <code>@unif/react-native-design</code> 导入对应 token(颜色走 <code>useColors()</code>)。</div>
  </div>
  <div className="unif-dont">
    <div className="unif-dont__x">×</div>
    <div><strong>不要</strong>把 <code>makeStyles</code> 内联进组件函数体 —— 会打穿 <code>useThemedStyles</code> 缓存。定义在模块顶层。</div>
  </div>
  <div className="unif-dont">
    <div className="unif-dont__x">×</div>
    <div><strong>不要</strong>用模态替换内联确认。内联确认(Confirmation)在消息流里渲染;模态仅留给登录选租户。</div>
  </div>
  <div className="unif-dont">
    <div className="unif-dont__x">×</div>
    <div><strong>不要</strong>引入弹簧动画、缩放入场、霓虹光晕。动效仅 fade + layout,时长 150–300ms。</div>
  </div>
</div>

> 详细规则见[设计原则](/docs/design/principles)、[颜色 → 取色优先级链](/docs/design/tokens/colors#取色优先级链)、[动效](/docs/design/tokens/motion);单文件全量 Don'ts 见[完整规范](/docs/unif-design)。
