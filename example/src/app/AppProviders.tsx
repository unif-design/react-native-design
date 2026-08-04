import React, { type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  ConfirmHost,
  ThemeProvider,
  ToastHost,
  normalizeFontScale,
} from '@unif/react-native-design';
import { ShowcaseProvider } from '../state/ShowcaseProvider';
import { useShowcase } from '../state/useShowcase';

function DesignRuntime({ children }: { children: ReactNode }) {
  const {
    state: { fontScale, runtimeHostsMounted, themeMode },
  } = useShowcase();

  return (
    <ThemeProvider
      forceScheme={themeMode === 'system' ? undefined : themeMode}
      fontScale={normalizeFontScale(fontScale)}
    >
      {children}
      {runtimeHostsMounted ? <ConfirmHost /> : null}
      {runtimeHostsMounted ? <ToastHost /> : null}
    </ThemeProvider>
  );
}

export function AppProviders({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ShowcaseProvider>
          <DesignRuntime>{children}</DesignRuntime>
        </ShowcaseProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
