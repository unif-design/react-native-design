import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useThemedStyles } from '../../../theme';
import { Button } from '../Button';
import type { ActionMenuContentProps } from './types';
import { makeStyles } from './styles';
import { ActionMenuItem } from './ActionMenuItem';
import { ActionMenuSheetCard } from './ActionMenuSheetCard';
import { ActionMenuPopoverCard } from './ActionMenuPopoverCard';

export function ActionMenuContent({
  actions,
  onClose,
  presentation = 'dialog',
  title,
  cancelLabel = '取消',
  pointer,
  onConfirmationChange,
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

  const confirmedId = confirming?.id ?? null;
  const notifyConfirmation = useRef(onConfirmationChange);
  notifyConfirmation.current = onConfirmationChange;
  useEffect(() => {
    notifyConfirmation.current?.(confirmedId);
  }, [confirmedId]);

  const heading = confirming?.confirmation?.title ?? title;
  const body = (
    <>
      {heading ? (
        <Text
          testID={`${testID}-title`}
          accessibilityRole="header"
          style={[styles.title, isPopover && confirming && styles.popoverTitle]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {heading}
        </Text>
      ) : null}
      {confirming?.confirmation ? (
        <>
          <Text
            style={[
              styles.confirmation,
              isPopover && styles.popoverConfirmation,
            ]}
            accessibilityLiveRegion="polite"
          >
            {confirming.confirmation.message}
          </Text>
          {isPopover ? (
            <View style={styles.popoverConfirmationActions}>
              {cancelLabel !== null ? (
                <ActionMenuItem
                  confirmation
                  action={{
                    id: 'cancel-confirmation',
                    label: cancelLabel,
                    onPress: cancelConfirmation,
                  }}
                  onPress={cancelConfirmation}
                />
              ) : null}
              <ActionMenuItem
                confirmation
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
              {cancelLabel !== null ? (
                <Button
                  label={cancelLabel}
                  variant="neutral"
                  style={styles.sheetAction}
                  onPress={cancelConfirmation}
                />
              ) : null}
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
          {!isSheet && !isPopover && cancelLabel !== null ? (
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
      <ActionMenuPopoverCard
        testID={testID}
        style={[confirming && styles.popoverConfirmRoot, style]}
        contentStyle={[confirming && styles.popoverConfirmCard, contentStyle]}
        pointer={pointer}
      >
        {body}
      </ActionMenuPopoverCard>
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
