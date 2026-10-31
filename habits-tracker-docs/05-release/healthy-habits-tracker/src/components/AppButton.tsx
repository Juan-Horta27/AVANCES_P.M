import React from 'react';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { colors, fontSize, radius, spacing } from '../constants/theme';

type Variante = 'primario' | 'secundario' | 'peligro';

interface Props {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  deshabilitado?: boolean;
  style?: ViewStyle;
}

/** Boton unico de la app, con tres variantes de intencion. */
export default function AppButton({
  titulo,
  onPress,
  variante = 'primario',
  deshabilitado = false,
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        estilosVariante[variante].contenedor,
        pressed && !deshabilitado ? styles.presionado : null,
        deshabilitado ? styles.deshabilitado : null,
        style,
      ]}
    >
      <Text style={[styles.texto, estilosVariante[variante].texto]}>{titulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md + 1,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  texto: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  presionado: {
    opacity: 0.75,
  },
  deshabilitado: {
    opacity: 0.4,
  },
});

const estilosVariante = {
  primario: StyleSheet.create({
    contenedor: { backgroundColor: colors.teal, borderColor: colors.teal },
    texto: { color: colors.bg },
  }),
  secundario: StyleSheet.create({
    contenedor: { backgroundColor: colors.surface2, borderColor: colors.border },
    texto: { color: colors.text },
  }),
  peligro: StyleSheet.create({
    contenedor: { backgroundColor: 'transparent', borderColor: colors.red },
    texto: { color: colors.red },
  }),
};
