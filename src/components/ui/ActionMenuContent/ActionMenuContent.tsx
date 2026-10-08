import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useThemedStyles } from '../../../theme';
import { Button } from '../Button';
import type { ActionMenuContentProps } from './types';
import { makeStyles } from './styles';
import { ActionMenuItem } from './ActionMenuItem';
import { ActionMenuSheetCard } from './ActionMenuSheetCard';

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
  const [confirmationId, setConfirmationId] = useState<string | null>(null);
  const isSheet = presentation === 'sheet';
  const isPopover = presentation === 'popover';
  const confirming = actions.find(
    (action) =>
      action.id === confirmationId && action.confirmation !== undefined
  );

  const cancelConfirmation = () => setConfirmationId(null);
  const confirmSelected = () => {
    if (!confirming) return;
    onClose();
    confirming.onPress();
  };

  useEffect(() => {
    if (!confirming) setConfirmationId(null);
  }, [confirming]);

  const body = (
    <>
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
          {isPopover ? (
            <View style={styles.popoverConfirmationActions}>
              <ActionMenuItem
                action={{
                  id: 'cancel-confirmation',
                  label: cancelLabel,
                  onPress: cancelConfirmation,
                }}
                onPress={cancelConfirmation}
              />
              <ActionMenuItem
                action={{
                  ...confirming,
                  label: confirming.confirmation.confirmLabel,
                  icon: undefined,
                  tone: 'danger',
                }}
                onPress={confirmSelected}
              />
            </View>
          ) : (
            <View style={styles.sheetActions}>
              <Button
                label={cancelLabel}
                variant="neutral"
                style={styles.sheetAction}
                onPress={cancelConfirmation}
              />
              <Button
                label={confirming.confirmation.confirmLabel}
                variant="danger"
                disabled={confirming.disabled}
                loading={confirming.loading}
                style={styles.sheetAction}
                onPress={confirmSelected}
              />
            </View>
          )}
        </>
      ) : (
        <>
          <View
            testID={`${testID}-actions`}
            style={isSheet ? styles.sheetActions : undefined}
          >
            {actions.map((action) =>
              isPopover ? (
                <ActionMenuItem
                  key={action.id}
                  action={action}
                  onPress={() => {
                    if (action.confirmation) setConfirmationId(action.id);
                    else action.onPress();
                  }}
                />
              ) : (
                <Button
                  key={action.id}
                  label={action.label}
                  leftIcon={action.icon}
                  accessibilityHint={action.accessibilityHint}
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
              )
            )}
          </View>
          {!isSheet && !isPopover ? (
            <Button label={cancelLabel} variant="text" onPress={onClose} />
          ) : null}
        </>
      )}
    </>
  );
  const content = isSheet ? (
    <ActionMenuSheetCard contentStyle={contentStyle} testID={`${testID}-card`}>
      {body}
    </ActionMenuSheetCard>
  ) : isPopover ? (
    <View testID={`${testID}-card`} style={[styles.popoverCard, contentStyle]}>
      {body}
    </View>
  ) : (
    <Pressable
      accessible={false}
      testID={`${testID}-card`}
      style={[styles.dialogCard, contentStyle]}
      onPress={(event) => event.stopPropagation()}
    >
      {body}
    </Pressable>
  );

  if (isPopover)
    return (
      <View testID={testID} style={[styles.popoverRoot, style]}>
        {content}
      </View>
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
