import React, { useState } from 'react';
import {
  SearchOutlined,
  SendOutlined,
  CameraOutlined,
  ImageOutlined,
  CheckOutlined,
  CloseOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  UserOutlined,
  HomeOutlined,
  BellOutlined,
  StarOutlined,
} from '@unif/react-native-icons';

const PREVIEW = [
  { name: 'SearchOutlined', Icon: SearchOutlined },
  { name: 'SendOutlined', Icon: SendOutlined },
  { name: 'CameraOutlined', Icon: CameraOutlined },
  { name: 'ImageOutlined', Icon: ImageOutlined },
  { name: 'CheckOutlined', Icon: CheckOutlined },
  { name: 'CloseOutlined', Icon: CloseOutlined },
  { name: 'ArrowLeftOutlined', Icon: ArrowLeftOutlined },
  { name: 'ArrowRightOutlined', Icon: ArrowRightOutlined },
  { name: 'UserOutlined', Icon: UserOutlined },
  { name: 'HomeOutlined', Icon: HomeOutlined },
  { name: 'BellOutlined', Icon: BellOutlined },
  { name: 'StarOutlined', Icon: StarOutlined },
] as const;

export default function IconCatalog(): React.JSX.Element {
  const [message, setMessage] = useState('');
  async function copy(name: string) {
    const code = `import { ${name} } from '@unif/react-native-icons';\n\n<${name} size={24} color="#EB6E00" />`;
    try {
      await navigator.clipboard.writeText(code);
      setMessage(`已复制 ${name} 的使用代码`);
    } catch {
      setMessage(`请手动复制：\n${code}`);
    }
  }
  return (
    <section className="ic-catalog" aria-label="常用图标预览">
      <div className="ic-preview-heading">
        <div>
          <h2>常用图标</h2>
          <p>点击复制独立图标组件代码</p>
        </div>
        <a href="https://unif-design.github.io/react-native-icons/#icons">
          查看全部图标 <span aria-hidden>↗</span>
        </a>
      </div>
      <div className="ic-grid">
        {PREVIEW.map(({ name, Icon }) => (
          <button
            key={name}
            type="button"
            className="ic-cell"
            aria-label={`复制 ${name} 使用代码`}
            onClick={() => copy(name)}
          >
            <span className="ic-cell__svg" aria-hidden="true">
              <Icon size={24} color="currentColor" />
            </span>
            <span className="ic-cell__name">
              {name.split(/(?=[A-Z])/).map((part, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <wbr />}
                  {part}
                </React.Fragment>
              ))}
            </span>
          </button>
        ))}
      </div>
      <pre className="ic-preview-message" role="status">
        {message}
      </pre>
    </section>
  );
}
