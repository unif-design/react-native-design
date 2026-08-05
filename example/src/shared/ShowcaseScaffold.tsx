import React, { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  NavBar,
  type ColorTokens,
  space,
  useThemedStyles,
} from '@unif/react-native-design';
import type { SceneId } from '../catalog/componentCatalog';
import { useShowcase } from '../state/useShowcase';
import { ResultPanel } from './ResultPanel';
import { SectionCard } from './SectionCard';

type ShowcaseScaffoldProps = Readonly<{
  title: string;
  children: ReactNode;
  scene?: SceneId;
  onBack?: () => void;
  onReset?: () => void;
  testID?: string;
}>;

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    safeArea: {
      backgroundColor: colors.background,
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    content: {
      gap: space['7'],
      padding: space['7'],
      paddingBottom: space['10'],
    },
    resultArea: {
      gap: space['5'],
    },
  });

export function ShowcaseScaffold({
  title,
  children,
  scene,
  onBack,
  onReset,
  testID,
}: ShowcaseScaffoldProps): React.JSX.Element {
  const { resetScene } = useShowcase();
  const styles = useThemedStyles(makeStyles);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.safeArea} testID={testID}>
        <NavBar
          title={title}
          left={
            onBack
              ? {
                  icon: 'arrow-left',
                  onPress: onBack,
                  accessibilityLabel: '返回首页',
                }
              : undefined
          }
        />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {children}
          {scene ? (
            <SectionCard title="场景与结果" testID="scene-result-area">
              <View style={styles.resultArea}>
                <Button
                  label="重置本场景"
                  variant="secondary"
                  onPress={() => {
                    resetScene(scene);
                    onReset?.();
                  }}
                />
                <ResultPanel />
              </View>
            </SectionCard>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
