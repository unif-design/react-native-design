import { createContext, useContext, type PropsWithChildren } from 'react';

const MotionContext = createContext(true);

/** 仅暂停所属页面的循环装饰，不卸载内容或改变业务运行状态。 */
export function MotionScope({
  active,
  children,
}: PropsWithChildren<{ active: boolean }>) {
  const parentActive = useMotionActive();
  return (
    <MotionContext.Provider value={parentActive && active}>
      {children}
    </MotionContext.Provider>
  );
}

export function useMotionActive(): boolean {
  return useContext(MotionContext);
}
