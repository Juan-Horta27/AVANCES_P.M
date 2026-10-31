import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '../constants/theme';

interface Props<T extends string> {
  opciones: ReadonlyArray<{ valor: T; etiqueta: string }>;
  seleccion: T;
  onSeleccionar: (valor: T) => void;
}

/** Selector segmentado (estilo pildora) para alternar vistas. */
export default function SegmentedTabs<T extends string>({
  opciones,
  seleccion,
  onSeleccionar,
}: Props<T>) {
  return (
    <View style={styles.contenedor}>
      {opciones.map((opcion) => {
        const activa = opcion.valor === seleccion;
        return (
          <Pressable
            key={opcion.valor}
            onPress={() => onSeleccionar(opcion.valor)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activa }}
            style={[styles.opcion, activa ? styles.opcionActiva : null]}
          >
            <Text style={[styles.texto, activa ? styles.textoActivo : null]}>
              {opcion.etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  opcion: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  opcionActiva: {
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
