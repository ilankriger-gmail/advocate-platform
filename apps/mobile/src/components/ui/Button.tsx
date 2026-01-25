import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '../../utils/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    // Size styles
    switch (size) {
      case 'sm':
        baseStyle.paddingVertical = spacing.sm;
        baseStyle.paddingHorizontal = spacing.md;
        break;
      case 'lg':
        baseStyle.paddingVertical = spacing.md + 4;
        baseStyle.paddingHorizontal = spacing.xl;
        break;
      default:
        baseStyle.paddingVertical = spacing.md;
        baseStyle.paddingHorizontal = spacing.lg;
    }

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyle.backgroundColor = colors.gray[100];
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = colors.primary[600];
        break;
      case 'ghost':
        baseStyle.backgroundColor = 'transparent';
        break;
      default:
        baseStyle.backgroundColor = colors.primary[600];
    }

    if (disabled || loading) {
      baseStyle.opacity = 0.6;
    }

    if (fullWidth) {
      baseStyle.width = '100%';
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: fontWeight.semibold,
    };

    switch (size) {
      case 'sm':
        baseStyle.fontSize = fontSize.sm;
        break;
      case 'lg':
        baseStyle.fontSize = fontSize.lg;
        break;
      default:
        baseStyle.fontSize = fontSize.base;
    }

    switch (variant) {
      case 'secondary':
        baseStyle.color = colors.gray[800];
        break;
      case 'outline':
      case 'ghost':
        baseStyle.color = colors.primary[600];
        break;
      default:
        baseStyle.color = colors.white;
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.white : colors.primary[600]}
          size="small"
          style={{ marginRight: spacing.sm }}
        />
      ) : null}
      <Text style={[getTextStyle(), textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}
