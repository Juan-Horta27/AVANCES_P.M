import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, spacing } from '../constants/theme';
import AppButton from './AppButton';

interface Props {
  icono: string;
  titulo: string;
  mensaje: string;
  accion?: { titulo: string; onPress: () => void };
}

/** Estado vacio reutilizable para listas sin datos. */
export default function EmptyState({ icono, titulo, mensaje, accion }: Props) {
  return (
    <View style={styles.contenedor}>
      <Text style={styles.icono}>{icono}</Text>
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.mensaje}>{mensaje}</Text>
      {accion ? (
        <AppButton
          titulo={accion.titulo}
          onPress={accion.onPress}
          variante="secundario"
          style={styles.boton}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  icono: {
    fontSize: 40,
  },
  titulo: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  mensaje: {
    color: colors.muted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  boton: {
    marginTop: spacing.sm,
  },
});
