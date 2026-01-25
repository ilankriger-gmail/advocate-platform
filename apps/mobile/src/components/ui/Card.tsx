import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, borderRadius, spacing, shadows } from '../../utils/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: boolean;
}

export function Card({
  children,
  style,
  padding = 'md',
  shadow = true,
}: CardProps) {
  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return spacing.sm;
      case 'lg':
        return spacing.lg;
      default:
        return spacing.md;
    }
  };

  return (
    <View
      style={[
        styles.card,
        { padding: getPadding() },
        shadow && shadows.md,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
});
