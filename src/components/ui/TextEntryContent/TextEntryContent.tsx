import React from 'react';
import { Text, View } from 'react-native';
import { useThemedStyles } from '../../../theme';
import { Button } from '../Button';
import { Textarea } from '../Textarea';
import { makeStyles } from './styles';
import type { TextEntryContentProps } from './types';

export function TextEntryContent({
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
  return (
    <View style={[styles.root, style]} testID={testID}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Textarea
        value={value}
        onChangeText={onChangeText}
        maxLength={maxLength}
        editable={!busy}
        autoFocus={autoFocus}
        accessibilityLabel={title}
      />
      <View style={styles.actions}>
        <Button
          label={confirmLabel}
          size="sm"
          loading={busy}
          onPress={() => onSubmit(value)}
        />
        <Button
          label={cancelLabel}
          size="sm"
          variant="outline"
          disabled={busy}
          onPress={onCancel}
        />
      </View>
    </View>
  );
}
