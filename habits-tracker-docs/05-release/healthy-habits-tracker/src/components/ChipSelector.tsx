import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '../constants/theme';

export interface Opcion {
  id: number;
  etiqueta: string;
}

interface Props {
  etiqueta: string;
  opciones: Opcion[];
  seleccion: number | null;
  onSeleccionar: (id: number) => void;
}

/**
 * Selector horizontal de una sola opcion.
 * Sustituye al <select> web sin necesidad de una libreria de picker.
 */
export default function ChipSelector({
  etiqueta,
  opciones,
  seleccion,
  onSeleccionar,
}: Props) {
  return (
    <View style={styles.contenedor}>
      <Text style={styles.etiqueta}>{etiqueta.toUpperCase()}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.fila}
      >
        {opciones.map((opcion) => {
          const activa = opcion.id === seleccion;
          return (
            <Pressable
              key={opcion.id}
              onPress={() => onSeleccionar(opcion.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: activa }}
              style={[styles.chip, activa ? styles.chipActivo : null]}
            >
              <Text style={[styles.texto, activa ? styles.textoActivo : null]}>
                {opcion.etiqueta}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: spacing.sm,
  },
  etiqueta: {
    color: colors.muted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  fila: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  chip: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg - 2,
    paddingVertical: spacing.sm + 2,
  },
  chipActivo: {
    borderColor: colors.teal,
    backgroundColor: colors.surface2,
  },
  texto: {
    color: colors.muted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  textoActivo: {
    color: colors.teal,
  },
});
