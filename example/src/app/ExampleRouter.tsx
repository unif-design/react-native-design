import React, { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { Empty } from '@unif/react-native-design';
import type { SceneId } from '../catalog/componentCatalog';
import { HomeScreen } from '../screens/HomeScreen';
import { ShowcaseScaffold } from '../shared/ShowcaseScaffold';
import { useShowcase } from '../state/useShowcase';
import { ActionsScene } from '../showcases/actions/ActionsScene';
import { FeedbackScene } from '../showcases/feedback/FeedbackScene';
import { FoundationScene } from '../showcases/foundation/FoundationScene';

const pendingSceneTitles: Readonly<
  Record<Exclude<SceneId, 'foundation' | 'actions' | 'feedback'>, string>
> = {
  forms: '表单与输入',
  navigation: '导航组件',
  collections: '容器与集合',
  media: '媒体展示',
  business: '业务复合组件',
};

function PendingScene({
  scene,
}: {
  scene: Exclude<SceneId, 'foundation' | 'actions' | 'feedback'>;
}): React.JSX.Element {
  const { back } = useShowcase();

  return (
    <ShowcaseScaffold
      title={pendingSceneTitles[scene]}
      scene={scene}
      onBack={() => {
        back();
      }}
      testID="pending-screen"
    >
      <Empty
        title="场景准备中"
        desc="该场景将在后续任务中接入。"
        icon="clipboard"
      />
    </ShowcaseScaffold>
  );
}

export function ExampleRouter(): React.JSX.Element {
  const { back, state } = useShowcase();
  const route = state.navigation[1] ?? 'home';

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      back
    );
    return () => {
      subscription.remove();
    };
  }, [back]);

  if (route === 'home') return <HomeScreen />;
  if (route === 'foundation') return <FoundationScene />;
  if (route === 'actions') return <ActionsScene />;
  if (route === 'feedback') return <FeedbackScene />;
  return <PendingScene scene={route} />;
}
