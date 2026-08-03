import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Card,
  type ColorTokens,
  fw,
  space,
  type,
  useThemedStyles,
} from '@unif/react-native-design';

type SectionCardProps = Readonly<{
  title: string;
  description?: string;
  children: ReactNode;
  testID?: string;
}>;

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    content: {
      gap: space['5'],
    },
    heading: {
      color: colors.foreground,
      fontSize: type.h2,
      fontWeight: fw.semi,
    },
    description: {
      color: colors.foregroundMuted,
      fontSize: type.sm,
    },
  });

export function SectionCard({
  title,
  description,
  children,
  testID,
}: SectionCardProps): React.JSX.Element {
  const styles = useThemedStyles(makeStyles);

  return (
    <Card testID={testID}>
      <View style={styles.content}>
        <Text accessibilityRole="header" style={styles.heading}>
          {title}
        </Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
        {children}
      </View>
    </Card>
  );
}
