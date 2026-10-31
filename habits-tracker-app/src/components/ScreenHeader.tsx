import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, spacing } from '../constants/theme';

interface Props {
  titulo: string;
  subtitulo?: string;
  derecha?: React.ReactNode;
}

/** Encabezado consistente para todas las pantallas. */
export default function ScreenHeader({ titulo, subtitulo, derecha }: Props) {
  return (
    <View style={styles.contenedor}>
      <View style={styles.textos}>
        <Text style={styles.titulo}>{titulo}</Text>
        {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
      </View>
      {derecha}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  textos: {
    flex: 1,
  },
  titulo: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitulo: {
    color: colors.muted,
    fontSize: fontSize.sm,
    marginTop: 3,
  },
});
