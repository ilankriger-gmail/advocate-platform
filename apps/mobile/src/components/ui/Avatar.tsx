import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors, borderRadius } from '../../utils/theme';

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Avatar({ uri, name, size = 'md' }: AvatarProps) {
  const getSize = () => {
    switch (size) {
      case 'sm':
        return 32;
      case 'lg':
        return 56;
      case 'xl':
        return 80;
      default:
        return 40;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 12;
      case 'lg':
        return 22;
      case 'xl':
        return 30;
      default:
        return 16;
    }
  };

  const dimension = getSize();
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.avatar,
          {
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: getFontSize() }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.gray[200],
  },
  placeholder: {
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.primary[700],
    fontWeight: '600',
  },
});
