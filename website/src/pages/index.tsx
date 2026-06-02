import React, { useState } from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';

import '../../../docs-home.css';

import {
  IconLayers,
  IconGrid,
  IconPalette,
  IconType,
  IconAccess,
  IconBell,
  IconUser,
  IconChevronRight,
  IconArrowRight,
  IconCopy,
  IconCheck,
} from '../components/home/icons';

/* ─── Code Window ─── */
type CodeLine = React.ReactNode;

interface CodeWindowProps {
  file: string;
  tag: string;
  hl: number;
  lines: CodeLine[];
}

function CodeWindow({ file, tag, hl, lines }: CodeWindowProps): React.JSX.Element {
  return (
    <div className="hp-code compact">
      <div className="hp-code-bar">
        <span className="hp-code-dots"><i /><i /><i /></span>
        <span className="hp-code-file">{file}</span>
        <span className="hp-code-tag">{tag}</span>
      </div>
      <div className="hp-code-body">
        <pre>
          {lines.map((node, i) => (
            <div key={i} className={'hp-cl' + (hl === i + 1 ? ' hl' : '')}>
              <span className="ln">{i + 1}</span>{node}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

/* ─── Phone Mockup ─── */
function Phone({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="hp-phone">
      <div className="hp-screen">
        <div className="hp-notch" />
        {children}
      </div>
    </div>
  );
}

/* ─── Gallery Screen (Design System components demo) ─── */
function GalleryScreen(): React.JSX.Element {
  return (
    <div className="hp-gal">
      <div className="hp-gal-nav">设计系统</div>
      <div className="hp-gal-body">
        <div className="hp-gal-label">Buttons</div>
        <div className="hp-gal-btns">
          <span className="hp-gal-btn primary">主要按钮</span>
          <span className="hp-gal-btn ghost">次要</span>
        </div>
        <div className="hp-gal-label">Tags</div>
        <div className="hp-gal-tags">
          <span className="hp-gal-tag green">已完成</span>
          <span className="hp-gal-tag orange">进行中</span>
          <span className="hp-gal-tag">草稿</span>
        </div>
        <div className="hp-gal-label">Cells</div>
        <div className="hp-gal-card">
          <div className="hp-gal-cell">
            <span className="hp-gal-ic"><IconBell s={17} /></span>
            <div className="hp-gal-ct">
              <div className="t">推送通知</div>
              <div className="s">实时接收拜访提醒</div>
            </div>
            <span className="hp-gal-sw on"><span /></span>
          </div>
          <div className="hp-gal-cell">
            <span className="hp-gal-ic"><IconUser s={17} /></span>
            <div className="hp-gal-ct">
              <div className="t">账户</div>
              <div className="s">王经理</div>
            </div>
            <IconChevronRight s={16} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Install command ─── */
const PKG = '@unif/react-native-design';

function InstallBlock(): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    void navigator.clipboard.writeText(`npm install ${PKG}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div className="hp-install">
      <span className="dollar">$</span>
      <span>npm install <span className="pkg">{PKG}</span></span>
      <button
        className={'hp-install-copy' + (copied ? ' copied' : '')}
        title="复制"
        onClick={handleCopy}
      >
        {copied ? <IconCheck s={15} /> : <IconCopy s={15} />}
      </button>
    </div>
  );
}

/* ─── Syntax token helpers ─── */
const K = (kw: string) => <span className="tok-kw">{kw}</span>;
const ST = (s: string) => <span className="tok-str">{s}</span>;
const FN = (s: string) => <span className="tok-fn">{s}</span>;
const DIM = (s: string) => <span className="tok-dim">{s}</span>;

const CODE_LINES: CodeLine[] = [
  <>{K('import')} <span className="tok-id">{'{ ThemeProvider, Button }'}</span></>,
  <>{'  '}{K('from')} {ST("'@unif/react-native-design'")}</>,
  <>{' '}</>,
  <>{DIM('<')}{FN('ThemeProvider')} theme={'{'}{ST("'dark'")}{'}'}{DIM('>')}</>,
  <>{'  '}{DIM('<')}{FN('Button')} variant={'{'}{ST("'primary'")}{'}'}{DIM('>')}提交{DIM('</')}{FN('Button')}{DIM('>')}</>,
  <>{DIM('</')}{FN('ThemeProvider')}{DIM('>')}</>,
];

/* ─── Feature card data ─── */
interface Feature {
  Icon: React.ComponentType<{ s?: number }>;
  title: string;
  desc: string;
}

const FEATURES: Feature[] = [
  {
    Icon: IconGrid,
    title: '基础组件',
    desc: 'Cell / Button / Tag / Card / Switch / List 等高频组件，覆盖企业内表单与列表场景。',
  },
  {
    Icon: IconPalette,
    title: '设计令牌',
    desc: '颜色、间距、圆角、阴影、动效全部令牌化，一处修改全局生效，与 Figma 变量对齐。',
  },
  {
    Icon: IconType,
    title: '亮 / 暗主题',
    desc: 'ThemeProvider 切换亮暗双主题，组件自动响应，无需手写两套样式。',
  },
  {
    Icon: IconAccess,
    title: '无障碍',
    desc: '默认提供语义角色、可达对比度与最小点按区域，符合移动端无障碍规范。',
  },
];

/* ─── Page ─── */
export default function Home(): React.JSX.Element {
  return (
    <Layout
      title="Unif Design — React Native 设计系统"
      description="@unif/react-native-design — 一套设计令牌驱动的 React Native 组件库：Cell / Button / Tag / Card，内建亮暗双主题与无障碍支持。"
    >
      <main className="unif-home">
        {/* ── Hero ── */}
        <section className="hp-hero">
          <div className="hp-hero-split hp-hero-final">
            {/* Copy side */}
            <div className="hp-hero-copy">
              <span className="hp-eyebrow">{PKG}</span>
              <h1 className="hp-title">
                统一企业的，<br />
                <span className="accent">React Native 设计系统</span>
              </h1>
              <p className="hp-tagline">
                一套设计令牌驱动的 React Native 组件库：Cell / Button / Tag / Card / Switch 等基础组件，内建亮暗双主题与无障碍支持。
              </p>
              <div className="hp-cta-row">
                <Link to="/docs/getting-started" className="hp-btn hp-btn-primary">
                  开始使用 <span className="hp-arrow"><IconArrowRight s={18} /></span>
                </Link>
                <Link to="/docs/components" className="hp-btn hp-btn-outline">
                  浏览组件
                </Link>
              </div>
              <InstallBlock />
              <div className="hp-meta-row">
                <span className="hp-chip"><span className="dot" />设计令牌</span>
                <span className="hp-chip">亮 / 暗主题</span>
                <span className="hp-chip">TypeScript</span>
              </div>
            </div>

            {/* Combo side: code window + phone mockup */}
            <div className="hp-combo">
              <div className="hp-combo-code">
                <CodeWindow
                  file="App.tsx"
                  tag="ThemeProvider"
                  hl={5}
                  lines={CODE_LINES}
                />
              </div>
              <div className="hp-combo-phone">
                <Phone><GalleryScreen /></Phone>
              </div>
              <span className="hp-combo-badge">
                <span className="dot" />组件实时预览
              </span>
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="hp-features">
          <div className="hp-sec-label">核心能力</div>
          <div className="hp-feature-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {FEATURES.map((f, i) => (
              <div className="hp-feature" key={i}>
                <div className="hp-feat-icon"><f.Icon s={24} /></div>
                <h3 className="hp-feat-title">{f.title}</h3>
                <p className="hp-feat-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}
