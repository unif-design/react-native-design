import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { RuntimeApiScreen } from '../../../manual-tests/runtime-api/RuntimeApiScreen';

const frameStyle: React.CSSProperties = {
  width: '100%',
  height: '100dvh',
  minHeight: '100vh',
  overflow: 'hidden',
};

const fallbackStyle: React.CSSProperties = {
  display: 'grid',
  minHeight: '100vh',
  placeItems: 'center',
  padding: 24,
};

/**
 * 与临时 RN app 共用同一份 RuntimeApiScreen，防止 native / Web 人工矩阵漂移。
 * BrowserOnly 让依赖真实 DOM、matchMedia 与 Modal portal 的用例不参与 SSG。
 */
export default function RuntimeApiPage(): React.JSX.Element {
  return (
    <BrowserOnly
      fallback={
        <main style={fallbackStyle}>
          <p>Runtime API Web fixture 仅在浏览器中运行。</p>
        </main>
      }
    >
      {() => (
        <div style={frameStyle}>
          <RuntimeApiScreen />
        </div>
      )}
    </BrowserOnly>
  );
}
