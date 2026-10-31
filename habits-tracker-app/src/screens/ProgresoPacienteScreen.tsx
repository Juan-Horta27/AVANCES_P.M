import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '../components/AppButton';
import Badge from '../components/Badge';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import ScreenHeader from '../components/ScreenHeader';
import SegmentedTabs from '../components/SegmentedTabs';
import { colorDeCumplimiento, colors, fontSize, radius, spacing } from '../constants/theme';
import { useApp } from '../context/AppContext';
import type { ProgresoHabito, ReporteProgreso, RootStackParamList } from '../types';
import { fechaCorta } from '../utils/date';
import { Rango, RangoPredefinido, moverExtremo, rangoPredefinido } from '../utils/rango';

type Props = NativeStackScreenProps<RootStackParamList, 'ProgresoPaciente'>;

/** 'personalizado' aparece cuando el profesional ajusta las fechas con las flechas. */
type SeleccionRango = RangoPredefinido | 'personalizado';

const ATAJOS: ReadonlyArray<{ valor: SeleccionRango; etiqueta: string }> = [
  { valor: 'semana', etiqueta: '7 días' },
  { valor: 'treintaDias', etiqueta: '30 días' },
  { valor: 'mes', etiqueta: 'Este mes' },
];

/**
 * Progreso de un paciente para el profesional (M-09, HU-02 Flujo 5): por hábito, días evaluados,
 * días cumplidos, porcentaje de adherencia y racha máxima en el rango elegido. Los cálculos los
 * hace el servidor (GET /reportes/progreso); la pantalla solo los muestra.
 */
export default function ProgresoPacienteScreen({ navigation, route }: Props) {
  const { usuarioId, nombre } = route.params;
  const { obtenerProgreso } = useApp();
  const [seleccion, setSeleccion] = useState<SeleccionRango>('treintaDias');
  const [rango, setRango] = useState<Rango>(rangoPredefinido('treintaDias'));
  const [reporte, setReporte] = useState<ReporteProgreso | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    const resultado = await obtenerProgreso(usuarioId, rango.inicio, rango.fin);
    setCargando(false);
    if (resultado.ok) setReporte(resultado.datos);
    else setError(resultado.mensaje);
  }, [obtenerProgreso, usuarioId, rango]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const elegirAtajo = (valor: SeleccionRango) => {
    if (valor === 'personalizado') return;
    setSeleccion(valor);
    setRango(rangoPredefinido(valor));
  };

  const mover = (extremo: keyof Rango, dias: number) => {
    const nuevo = moverExtremo(rango, extremo, dias);
    if (nuevo === rango) return;
    setSeleccion('personalizado');
    setRango(nuevo);
  };

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <ScreenHeader
          titulo={nombre}
          subtitulo="Progreso del paciente"
          derecha={
            <Text
              style={styles.volver}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Volver a la lista de pacientes"
            >
              ‹ Pacientes
            </Text>
          }
        />

        <SegmentedTabs opciones={ATAJOS} seleccion={seleccion} onSeleccionar={elegirAtajo} />

        <View style={styles.rango}>
          <SelectorFecha
            etiqueta="Desde"
            fecha={rango.inicio}
            onAnterior={() => mover('inicio', -1)}
            onSiguiente={() => mover('inicio', 1)}
          />
          <SelectorFecha
            etiqueta="Hasta"
            fecha={rango.fin}
            onAnterior={() => mover('fin', -1)}
            onSiguiente={() => mover('fin', 1)}
          />
        </View>

        {cargando ? (
          <View style={styles.estado} accessibilityLiveRegion="polite">
            <ActivityIndicator size="large" color={colors.teal} />
            <Text style={styles.estadoTexto}>Calculando el progreso…</Text>
          </View>
        ) : error ? (
          <View style={styles.estado} accessibilityLiveRegion="polite">
            <Text style={styles.estadoTexto}>⚠️ {error}</Text>
            <AppButton titulo="Reintentar" onPress={() => void cargar()} />
          </View>
        ) : reporte && reporte.totales.diasEvaluados === 0 ? (
          <EmptyState
            icono="📭"
            titulo="Sin registros en este rango"
            mensaje={
              reporte.habitos.length === 0
                ? 'Este paciente todavía no tiene hábitos.'
                : 'Prueba con un rango de fechas más amplio.'
            }
          />
        ) : reporte ? (
          <>
            <Card style={styles.resumen}>
              <Metrica valor={reporte.totales.diasEvaluados} etiqueta="Días evaluados" />
              <Metrica valor={reporte.totales.diasCumplidos} etiqueta="Días cumplidos" />
              <Metrica
                valor={`${reporte.totales.porcentajeAdherencia}%`}
                etiqueta="Adherencia"
                color={colorDeCumplimiento(reporte.totales.porcentajeAdherencia)}
              />
            </Card>
            {reporte.habitos.map((habito) => (
              <TarjetaHabito key={habito.habitoId} habito={habito} />
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function SelectorFecha({
  etiqueta,
  fecha,
  onAnterior,
  onSiguiente,
}: {
  etiqueta: string;
  fecha: string;
  onAnterior: () => void;
  onSiguiente: () => void;
}) {
  return (
    <View style={styles.selector}>
      <Text style={styles.selectorEtiqueta}>{etiqueta.toUpperCase()}</Text>
      <View style={styles.selectorFila}>
        <Text
          style={styles.flecha}
          onPress={onAnterior}
          accessibilityRole="button"
          accessibilityLabel={`${etiqueta}: día anterior`}
        >
          ‹
        </Text>
        <Text style={styles.selectorFecha}>{fechaCorta(fecha)}</Text>
        <Text
          style={styles.flecha}
          onPress={onSiguiente}
          accessibilityRole="button"
          accessibilityLabel={`${etiqueta}: día siguiente`}
        >
          ›
        </Text>
      </View>
    </View>
  );
}

function Metrica({
  valor,
  etiqueta,
  color = colors.text,
}: {
  valor: number | string;
  etiqueta: string;
  color?: string;
}) {
  return (
    <View style={styles.metrica} accessible accessibilityLabel={`${valor}, ${etiqueta}`}>
      <Text style={[styles.metricaValor, { color }]}>{valor}</Text>
      <Text style={styles.metricaEtiqueta}>{etiqueta}</Text>
    </View>
  );
}

function TarjetaHabito({ habito }: { habito: ProgresoHabito }) {
  const color = colorDeCumplimiento(habito.porcentajeAdherencia);
  return (
    <Card>
      <View style={styles.encabezado}>
        <Text style={styles.icono}>{habito.icono ?? '🏷️'}</Text>
        <View style={styles.flex}>
          <Text style={styles.nombre}>{habito.nombre}</Text>
          <Text style={styles.detalle}>
            {habito.metaActiva === null
              ? 'Sin meta activa'
              : `Meta: ${habito.metaActiva} ${habito.unidadMedida}`}
          </Text>
        </View>
        {habito.activo ? null : <Badge texto="Archivado" />}
      </View>
      <View style={styles.filaPorcentaje}>
        <Text style={styles.detalle}>
          {habito.diasCumplidos} de {habito.diasEvaluados} días cumplidos
        </Text>
        <Text style={[styles.porcentaje, { color }]}>{habito.porcentajeAdherencia}%</Text>
      </View>
      <View
        style={styles.barra}
        accessible
        accessibilityLabel={`Adherencia ${habito.porcentajeAdherencia}%`}
      >
        <View
          style={[
            styles.relleno,
            { width: `${habito.porcentajeAdherencia}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={styles.detalle}>🔥 Racha máxima: {habito.rachaMaxima} días</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.bg },
  contenido: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  flex: { flex: 1 },
  volver: { color: colors.teal, fontSize: fontSize.sm, fontWeight: '600' },
  rango: { flexDirection: 'row', gap: spacing.md },
  selector: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  selectorEtiqueta: { color: colors.muted, fontSize: fontSize.xs, fontWeight: '700' },
  selectorFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectorFecha: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  flecha: {
    color: colors.teal,
    fontSize: fontSize.xl,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
  },
  estado: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  estadoTexto: { color: colors.text, fontSize: fontSize.md, textAlign: 'center' },
  resumen: { flexDirection: 'row' },
  metrica: { flex: 1, alignItems: 'center' },
  metricaValor: { fontSize: fontSize.xl, fontWeight: '800' },
  metricaEtiqueta: { color: colors.muted, fontSize: fontSize.xs, marginTop: spacing.xs },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icono: { fontSize: fontSize.xl },
  nombre: { color: colors.text, fontSize: fontSize.md + 1, fontWeight: '700' },
  detalle: { color: colors.muted, fontSize: fontSize.sm },
  filaPorcentaje: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  porcentaje: { fontSize: fontSize.md, fontWeight: '800' },
  barra: {
    height: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    overflow: 'hidden',
    marginVertical: spacing.sm,
  },
  relleno: { height: '100%', borderRadius: radius.pill },
});
