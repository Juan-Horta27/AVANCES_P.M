import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colorDeCumplimiento, colors, fontSize, radius, spacing } from '../constants/theme';
import { diaCorto } from '../utils/date';

interface Dia {
  fecha: string;
  total: number;
  cumplidas: number;
  porcentaje: number;
}

interface Props {
  dias: Dia[];
}

const ALTURA_MAXIMA = 90;

/** Grafica de barras de la semana, construida solo con Views (sin librerias). */
export default function WeekChart({ dias }: Props) {
  return (
    <View style={styles.contenedor}>
      {dias.map((dia) => {
        const altura =
          dia.total > 0 ? Math.max(14, (dia.porcentaje / 100) * ALTURA_MAXIMA) : 6;

        return (
          <View
            key={dia.fecha}
            style={styles.columna}
            accessible
            accessibilityLabel={
              dia.total > 0
                ? `${diaCorto(dia.fecha)}: ${dia.cumplidas} de ${dia.total} cumplidas, ${dia.porcentaje}%`
                : `${diaCorto(dia.fecha)}: sin registros`
            }
          >
            <Text style={styles.porcentaje}>{dia.total > 0 ? `${dia.porcentaje}%` : ''}</Text>
            <View
              style={[styles.barra, { height: altura, backgroundColor: colorSegun(dia) }]}
            />
            <Text style={styles.dia}>{diaCorto(dia.fecha)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function colorSegun(dia: Dia): string {
  return dia.total === 0 ? colors.surface2 : colorDeCumplimiento(dia.porcentaje);
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    height: ALTURA_MAXIMA + 44,
  },
  columna: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  barra: {
    width: '100%',
    borderRadius: radius.sm,
  },
  porcentaje: {
    color: colors.muted,
    fontSize: fontSize.xs - 1,
    height: 14,
  },
  dia: {
    color: colors.muted,
    fontSize: fontSize.xs + 1,
  },
});
