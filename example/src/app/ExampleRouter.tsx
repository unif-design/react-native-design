import React, { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { useShowcase } from '../state/useShowcase';
import { ActionsScene } from '../showcases/actions/ActionsScene';
import { BusinessScene } from '../showcases/business/BusinessScene';
import { CollectionsScene } from '../showcases/collections/CollectionsScene';
import { FeedbackScene } from '../showcases/feedback/FeedbackScene';
import { FoundationScene } from '../showcases/foundation/FoundationScene';
import { FormsScene } from '../showcases/forms/FormsScene';
import { MediaScene } from '../showcases/media/MediaScene';
import { NavigationScene } from '../showcases/navigation/NavigationScene';

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
  if (route === 'forms') return <FormsScene />;
  if (route === 'navigation') return <NavigationScene />;
  if (route === 'collections') return <CollectionsScene />;
  if (route === 'media') return <MediaScene />;
  return <BusinessScene />;
}
