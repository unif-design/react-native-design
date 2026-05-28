import React from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';

export default function Home(): React.JSX.Element {
  return (
    <Layout
      title="Unif Design"
      description="@unif/react-native-design — 移动优先的 React Native 设计系统"
    >
      <header className="unif-hero">
        <div className="unif-hero__inner">
          <span className="unif-hero__pill">@UNIF/REACT-NATIVE-DESIGN</span>
          <h1 className="unif-hero__title">Unif Design</h1>
          <p className="unif-hero__lede">
            一套设计令牌、一套组件契约,直接 import 即用。中文优先、橙色克制、无装饰。
          </p>
          <div className="unif-hero__ctas">
            <Link to="/docs/components" className="unif-hero__cta unif-hero__cta--primary">
              开始使用 →
            </Link>
            <Link to="/docs/unif-design" className="unif-hero__cta unif-hero__cta--ghost">
              设计
            </Link>
          </div>
        </div>
      </header>
    </Layout>
  );
}
