import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { space, useThemedStyles } from '../../../theme';
import { Button } from '../Button';
import type { ActionMenuContentProps } from './types';
import { makeStyles } from './styles';

export function ActionMenuContent({
  actions,
  onClose,
  presentation = 'dialog',
  title,
  cancelLabel = '取消',
  style,
  contentStyle,
  testID = 'action-menu',
}: ActionMenuContentProps): React.JSX.Element {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [confirmationId, setConfirmationId] = useState<string | null>(null);
  const isSheet = presentation === 'sheet';
  const confirming = actions.find(
    (action) =>
      action.id === confirmationId && action.confirmation !== undefined
  );

  useEffect(() => {
    if (!confirming) setConfirmationId(null);
  }, [confirming]);

  const content = (
    <Pressable
      accessible={false}
      testID={`${testID}-card`}
      style={[
        isSheet ? styles.sheetCard : styles.dialogCard,
        isSheet && { paddingBottom: insets.bottom + space[5] },
        contentStyle,
      ]}
      onPress={(event) => event.stopPropagation()}
    >
      {title ? (
        <Text
          testID={`${testID}-title`}
          style={styles.title}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
      ) : null}
      {confirming?.confirmation ? (
        <>
          <Text style={styles.confirmation} accessibilityLiveRegion="polite">
            {confirming.confirmation.message}
          </Text>
          <View style={styles.sheetActions}>
            <Button
              label={cancelLabel}
              variant="neutral"
              style={styles.sheetAction}
              onPress={() => setConfirmationId(null)}
            />
            <Button
              label={confirming.confirmation.confirmLabel}
              variant="danger"
              disabled={confirming.disabled}
              loading={confirming.loading}
              style={styles.sheetAction}
              onPress={() => {
                onClose();
                confirming.onPress();
              }}
            />
          </View>
        </>
      ) : (
        <>
          <View
            testID={`${testID}-actions`}
            style={isSheet ? styles.sheetActions : undefined}
          >
            {actions.map((action) => (
              <Button
                key={action.id}
                label={action.label}
                disabled={action.disabled}
                loading={action.loading}
                variant={isSheet ? (action.tone ?? 'neutral') : 'text'}
                style={isSheet ? styles.sheetAction : undefined}
                onPress={() => {
                  if (action.confirmation) {
                    setConfirmationId(action.id);
                    return;
                  }
                  action.onPress();
                }}
              />
            ))}
          </View>
          {!isSheet ? (
            <Button label={cancelLabel} variant="text" onPress={onClose} />
          ) : null}
        </>
      )}
    </Pressable>
  );

  return (
    <Pressable
      accessible={false}
      testID={testID}
      style={[isSheet ? styles.sheetRoot : styles.dialogRoot, style]}
      onPress={onClose}
    >
      {content}
    </Pressable>
  );
}
