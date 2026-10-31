import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import ScreenHeader from '../components/ScreenHeader';
import SegmentedTabs from '../components/SegmentedTabs';
import { colors, fontSize, radius, spacing } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { MESES, aDate, inicioDeSemana, nombreMes } from '../utils/date';

type Modo = 'mensual' | 'semanal';

const OPCIONES = [
  { valor: 'mensual' as const, etiqueta: 'Por mes' },
  { valor: 'semanal' as const, etiqueta: 'Por semana' },
];

export default function HistorialScreen() {
  const { registros, habitoPorId } = useApp();
  const [modo, setModo] = useState<Modo>('mensual');

  const ahora = new Date();
  const [mes, setMes] = useState(ahora.getMonth());
  const anio = ahora.getFullYear();

  // ------------------------------------------------------------- vista mensual
  const registrosDelMes = useMemo(() => {
    return registros.filter((r) => {
      const fecha = aDate(r.fecha);
      return fecha.getMonth() === mes && fecha.getFullYear() === anio;
    });
  }, [registros, mes, anio]);

  const porHabito = useMemo(() => {
    const mapa = new Map<number, { total: number; cumplidas: number; suma: number }>();
    for (const registro of registrosDelMes) {
      const actual = mapa.get(registro.habitoId) ?? { total: 0, cumplidas: 0, suma: 0 };
      actual.total += 1;
      actual.suma += registro.valorRegistrado;
      if (registro.metaCumplida) actual.cumplidas += 1;
      mapa.set(registro.habitoId, actual);
    }
    return Array.from(mapa.entries());
  }, [registrosDelMes]);

  // ------------------------------------------------------------ vista semanal
  const porSemana = useMemo(() => {
    const mapa = new Map<string, { total: number; cumplidas: number }>();
    for (const registro of registros) {
      const lunes = inicioDeSemana(registro.fecha);
      const actual = mapa.get(lunes) ?? { total: 0, cumplidas: 0 };
      actual.total += 1;
      if (registro.metaCumplida) actual.cumplidas += 1;
      mapa.set(lunes, actual);
    }
    return Array.from(mapa.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [registros]);

  const totalMes = registrosDelMes.length;
  const cumplidasMes = registrosDelMes.filter((r) => r.metaCumplida).length;
  const porcentajeMes = totalMes > 0 ? Math.round((cumplidasMes / totalMes) * 100) : 0;

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      <ScrollView contentContainerStyle={styles.contenido} showsVerticalScrollIndicator={false}>
        <ScreenHeader titulo="📊 Historial" subtitulo="Tu progreso acumulado" />

        <SegmentedTabs opciones={OPCIONES} seleccion={modo} onSeleccionar={setModo} />

        {modo === 'mensual' ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.meses}
              style={styles.mesesContenedor}
            >
              {MESES.map((nombre, indice) => {
                const activo = indice === mes;
                return (
                  <Text
                    key={nombre}
                    onPress={() => setMes(indice)}
                    style={[styles.mes, activo ? styles.mesActivo : null]}
                  >
                    {nombre.slice(0, 3)}
                  </Text>
                );
              })}
            </ScrollView>

            <Card style={styles.resumen}>
              <Text style={styles.tituloResumen}>
                {nombreMes(mes)} {anio}
              </Text>
              <View style={styles.filaResumen}>
                <Metrica valor={totalMes} etiqueta="Registros" color={colors.teal} />
                <Metrica valor={cumplidasMes} etiqueta="Cumplidas" color={colors.green} />
                <Metrica
                  valor={`${porcentajeMes}%`}
                  etiqueta="Cumplimiento"
                  color={colors.orange}
                />
              </View>
            </Card>

            {porHabito.length === 0 ? (
              <EmptyState
                icono="📊"
                titulo="Sin datos este mes"
                mensaje="No hay registros para el mes seleccionado."
              />
            ) : (
              porHabito.map(([habitoId, datos]) => {
                const habito = habitoPorId(habitoId);
                const porcentaje = Math.round((datos.cumplidas / datos.total) * 100);
                const promedio = Math.round((datos.suma / datos.total) * 10) / 10;

                return (
                  <Card key={habitoId} style={styles.tarjeta}>
                    <View style={styles.encabezadoHabito}>
                      <Text style={styles.nombreHabito}>{habito?.nombre ?? 'Habito'}</Text>
                      <Text style={[styles.porcentaje, { color: colorSegun(porcentaje) }]}>
                        {porcentaje}%
                      </Text>
                    </View>

                    <View style={styles.barraFondo}>
                      <View
                        style={[
                          styles.barraRelleno,
                          { width: ancho(porcentaje), backgroundColor: colorSegun(porcentaje) },
                        ]}
                      />
                    </View>

                    <Text style={styles.detalle}>
                      {datos.cumplidas} de {datos.total} dias · promedio {promedio}{' '}
                      {habito?.unidadMedida ?? ''}
                    </Text>
                  </Card>
                );
              })
            )}
          </>
        ) : (
          <>
            {porSemana.length === 0 ? (
              <EmptyState
                icono="📊"
                titulo="Sin datos"
                mensaje="Todavia no hay registros para agrupar por semana."
              />
            ) : (
              porSemana.map(([lunes, datos]) => {
                const porcentaje = Math.round((datos.cumplidas / datos.total) * 100);
                return (
                  <Card key={lunes} style={styles.tarjeta}>
                    <View style={styles.encabezadoHabito}>
                      <Text style={styles.nombreHabito}>Semana del {lunes}</Text>
                      <Text style={[styles.porcentaje, { color: colorSegun(porcentaje) }]}>
                        {porcentaje}%
                      </Text>
                    </View>
                    <View style={styles.barraFondo}>
                      <View
                        style={[
                          styles.barraRelleno,
                          { width: ancho(porcentaje), backgroundColor: colorSegun(porcentaje) },
                        ]}
                      />
                    </View>
                    <Text style={styles.detalle}>
                      {datos.cumplidas} metas cumplidas de {datos.total} registros
                    </Text>
                  </Card>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metrica({
  valor,
  etiqueta,
  color,
}: {
  valor: string | number;
  etiqueta: string;
  color: string;
}) {
  return (
    <View style={styles.metrica}>
      <Text style={[styles.metricaValor, { color }]}>{valor}</Text>
      <Text style={styles.metricaEtiqueta}>{etiqueta}</Text>
    </View>
  );
}

function colorSegun(porcentaje: number): string {
  if (porcentaje >= 80) return colors.green;
  if (porcentaje >= 50) return colors.orange;
  return colors.red;
}

/** React Native exige el formato `${number}%` para los anchos porcentuales. */
function ancho(porcentaje: number): `${number}%` {
  return `${porcentaje}%`;
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.bg },
  contenido: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  mesesContenedor: { marginTop: spacing.xs },
  meses: { gap: spacing.sm },
  mes: {
    color: colors.muted,
    fontSize: fontSize.sm,
    fontWeight: '600',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  mesActivo: { color: colors.teal, borderColor: colors.teal, backgroundColor: colors.surface2 },
  resumen: { marginTop: spacing.xs },
  tituloResumen: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
    marginBottom: spacing.lg,
    textTransform: 'capitalize',
  },
  filaResumen: { flexDirection: 'row' },
  metrica: { flex: 1, alignItems: 'center' },
  metricaValor: { fontSize: fontSize.xl, fontWeight: '800' },
  metricaEtiqueta: { color: colors.muted, fontSize: fontSize.xs + 1, marginTop: 2 },
  tarjeta: { gap: spacing.md },
  encabezadoHabito: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nombreHabito: { color: colors.text, fontSize: fontSize.sm + 1, fontWeight: '700' },
  porcentaje: { fontSize: fontSize.md, fontWeight: '800' },
  barraFondo: {
    height: 8,
    backgroundColor: colors.surface2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  barraRelleno: { height: '100%', borderRadius: radius.pill },
  detalle: { color: colors.muted, fontSize: fontSize.xs + 1 },
});
