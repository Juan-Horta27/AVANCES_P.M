import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '../constants/theme';

interface Props {
  children: React.ReactNode;
  /** Franja de color en el borde superior (opcional) */
  acento?: string;
  style?: ViewStyle;
}

/** Contenedor base de toda la app: superficie oscura con borde sutil. */
export default function Card({ children, acento, style }: Props) {
  return (
    <View
      style={[
        styles.card,
        acento ? { borderTopColor: acento, borderTopWidth: 3 } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
});
