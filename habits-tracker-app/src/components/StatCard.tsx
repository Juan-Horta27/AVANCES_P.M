import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, spacing } from '../constants/theme';
import Card from './Card';

interface Props {
  icono: string;
  valor: string | number;
  etiqueta: string;
  detalle?: string;
  color: string;
}

/** Tarjeta de metrica del dashboard. */
export default function StatCard({ icono, valor, etiqueta, detalle, color }: Props) {
  return (
    <Card acento={color} style={styles.card}>
      {/* Un solo anuncio para el lector de pantalla: valor, etiqueta y detalle juntos. */}
      <View
        accessible
        accessibilityLabel={[String(valor), etiqueta, detalle].filter(Boolean).join(', ')}
      >
        <Text style={styles.icono}>{icono}</Text>
        <Text style={[styles.valor, { color }]} numberOfLines={1} adjustsFontSizeToFit>
          {valor}
        </Text>
        {detalle ? <Text style={styles.detalle}>{detalle}</Text> : null}
        <Text style={styles.etiqueta}>{etiqueta}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    padding: spacing.lg - 2,
  },
  icono: {
    fontSize: 22,
    marginBottom: spacing.sm,
  },
  valor: {
    fontSize: fontSize.xxl - 4,
    fontWeight: '800',
  },
  detalle: {
    color: colors.muted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  etiqueta: {
    color: colors.muted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs + 2,
  },
});
