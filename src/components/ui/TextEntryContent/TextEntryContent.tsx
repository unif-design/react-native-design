import React from 'react';
import { Text, View } from 'react-native';
import { useThemedStyles } from '../../../theme';
import { Button } from '../Button';
import { Textarea } from '../Textarea';
import { Input } from '../Input';
import { makeStyles } from './styles';
import type { TextEntryContentProps } from './types';

export function TextEntryContent({
  variant = 'card',
  placeholder,
  title,
  value,
  onChangeText,
  onSubmit,
  onCancel,
  message,
  busy = false,
  maxLength,
  confirmLabel = '确认',
  cancelLabel = '取消',
  autoFocus = true,
  style,
  testID,
}: TextEntryContentProps): React.JSX.Element {
  const styles = useThemedStyles(makeStyles);
  const compact = variant === 'compact';
  const Field = compact ? Input : Textarea;
  return (
    <View
      style={[styles.root, compact && styles.compactRoot, style]}
      testID={testID}
    >
      <Text
        style={[styles.title, compact && styles.compactTitle]}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Field
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        editable={!busy}
        autoFocus={autoFocus}
        accessibilityLabel={title}
        placeholder={placeholder}
      />
      <View style={[styles.actions, compact && styles.compactActions]}>
        {compact ? (
          <Button
            label={cancelLabel}
            size="sm"
            variant="ghost"
            disabled={busy}
            onPress={onCancel}
          />
        ) : null}
        <Button
          label={confirmLabel}
          size="sm"
          loading={busy}
          onPress={() => onSubmit(value)}
        />
        {!compact ? (
          <Button
            label={cancelLabel}
            size="sm"
            variant="outline"
            disabled={busy}
            onPress={onCancel}
          />
        ) : null}
      </View>
    </View>
  );
}
