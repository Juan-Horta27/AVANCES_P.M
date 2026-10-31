import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, spacing } from '../constants/theme';

interface Props {
  /** Texto con la antigüedad de los datos, por ejemplo "datos de las 21:10". */
  detalle: string;
  reintentando: boolean;
  onReintentar: () => void;
}

/**
 * Franja que avisa que se están mostrando datos guardados porque no hay conexión
 * (estado "sin conexión" del DoD). El color no es el único portador del mensaje: lo dice el texto.
 */
export default function AvisoSinConexion({ detalle, reintentando, onReintentar }: Props) {
  return (
    <View style={styles.franja} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text style={styles.texto}>📡 Sin conexión · {detalle}</Text>
      <Pressable
        onPress={onReintentar}
        disabled={reintentando}
        accessibilityRole="button"
        accessibilityLabel="Reintentar conexión"
        accessibilityState={{ disabled: reintentando, busy: reintentando }}
        hitSlop={spacing.sm}
      >
        {reintentando ? (
          <ActivityIndicator size="small" color={colors.orange} />
        ) : (
          <Text style={styles.accion}>Reintentar</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  franja: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.surface2,
    borderTopWidth: 1,
    borderTopColor: colors.orange,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  texto: { flex: 1, color: colors.text, fontSize: fontSize.sm },
  accion: { color: colors.orange, fontSize: fontSize.sm, fontWeight: '700' },
});
