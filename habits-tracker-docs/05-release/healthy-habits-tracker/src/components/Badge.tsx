import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '../constants/theme';

interface Props {
  texto: string;
  color?: string;
}

/** Etiqueta pequena de estado (activa/inactiva, categoria, etc.). */
export default function Badge({ texto, color = colors.muted }: Props) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.texto, { color }]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  texto: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
});
