import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '../components/AppButton';
import Card from '../components/Card';
import ScreenHeader from '../components/ScreenHeader';
import StatCard from '../components/StatCard';
import WeekChart from '../components/WeekChart';
import { colors, fontSize, spacing } from '../constants/theme';
import { useApp } from '../context/AppContext';
import type { RootStackParamList } from '../types';
import { fechaLarga, hoyISO } from '../utils/date';

type Navegacion = NativeStackNavigationProp<RootStackParamList>;

export default function DashboardScreen() {
  const navigation = useNavigation<Navegacion>();
  const {
    usuario,
    habitos,
    registros,
    actividadSemanal,
    registrosDeHoy,
    metaActivaDe,
    rachaDe,
    habitoPorId,
    cerrarSesion,
  } = useApp();

  const habitosActivos = habitos.filter((h) => h.activo);
  const habitosRegistradosHoy = new Set(registrosDeHoy.map((r) => r.habitoId)).size;
  const registrosSemana = actividadSemanal.reduce((suma, dia) => suma + dia.total, 0);
  const cumplidasSemana = actividadSemanal.reduce((suma, dia) => suma + dia.cumplidas, 0);
  const mejorRacha = habitosActivos.reduce(
    (max, h) => Math.max(max, rachaDe(h.id).rachaActual),
    0,
  );

  const confirmarCierre = () => {
    Alert.alert('Cerrar sesion', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: () => {
          cerrarSesion();
          navigation.replace('Login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <ScreenHeader
          titulo={`Hola, ${usuario?.nombres.split(' ')[0] ?? 'invitado'} 👋`}
          subtitulo={fechaLarga(hoyISO())}
          derecha={
            <Text style={styles.salir} onPress={confirmarCierre}>
              Salir
            </Text>
          }
        />

        <View style={styles.metricas}>
          <StatCard
            icono="📌"
            valor={habitosActivos.length}
            etiqueta="Habitos activos"
            color={colors.teal}
          />
          <StatCard
            icono="✅"
            valor={`${habitosRegistradosHoy}/${habitosActivos.length}`}
            detalle={
              habitosActivos.length > 0
                ? `${Math.round((habitosRegistradosHoy / habitosActivos.length) * 100)}%`
                : '0%'
            }
            etiqueta="Completados hoy"
            color={colors.green}
          />
          <StatCard
            icono="🎯"
            valor={cumplidasSemana}
            detalle={`de ${registrosSemana} registros`}
            etiqueta="Metas esta semana"
            color={colors.orange}
          />
          <StatCard
            icono="🔥"
            valor={`${mejorRacha} dias`}
            etiqueta="Mejor racha actual"
            color={colors.red}
          />
        </View>

        <AppButton
          titulo="+ Registrar hoy"
          onPress={() => navigation.navigate('NuevoRegistro')}
          style={styles.botonPrincipal}
        />

        <Card style={styles.bloque}>
          <Text style={styles.tituloBloque}>📅 Actividad de la semana</Text>
          <WeekChart dias={actividadSemanal} />
        </Card>

        <Card style={styles.bloque}>
          <Text style={styles.tituloBloque}>🔥 Rachas actuales</Text>
          {habitosActivos.length === 0 ? (
            <Text style={styles.vacio}>Aun no tienes habitos activos.</Text>
          ) : (
            <View style={styles.lista}>
              {habitosActivos.map((habito) => {
                const meta = metaActivaDe(habito.id);
                const racha = rachaDe(habito.id);
                return (
                  <View key={habito.id} style={styles.filaHabito}>
                    <View style={styles.flex}>
                      <Text style={styles.nombreHabito}>{habito.nombre}</Text>
                      <Text style={styles.detalleHabito}>
                        {meta
                          ? `Meta: ${meta.valorObjetivo} ${habito.unidadMedida}`
                          : 'Sin meta activa'}
                      </Text>
                    </View>
                    <View style={styles.derecha}>
                      <Text style={styles.rachaValor}>{racha.rachaActual}🔥</Text>
                      <Text style={styles.rachaMax}>max: {racha.rachaMaxima}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </Card>

        <Card style={styles.bloque}>
          <Text style={styles.tituloBloque}>📝 Registrado hoy</Text>
          {registrosDeHoy.length === 0 ? (
            <Text style={styles.vacio}>Aun no has registrado nada hoy.</Text>
          ) : (
            <View style={styles.lista}>
              {registrosDeHoy.map((registro) => {
                const habito = habitoPorId(registro.habitoId);
                return (
                  <View key={registro.id} style={styles.filaHabito}>
                    <Text style={styles.nombreHabito}>
                      {registro.metaCumplida ? '✅' : '⭕'} {habito?.nombre ?? 'Habito'}
                    </Text>
                    <Text style={styles.valorRegistro}>
                      {registro.valorRegistrado} {habito?.unidadMedida}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </Card>

        <Text style={styles.pie}>{registros.length} registros en total</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.bg },
  contenido: { padding: spacing.lg, paddingBottom: spacing.xxl },
  flex: { flex: 1 },
  salir: { color: colors.red, fontSize: fontSize.sm, fontWeight: '600' },
  metricas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  botonPrincipal: { marginTop: spacing.lg },
  bloque: { marginTop: spacing.lg },
  tituloBloque: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  lista: { gap: spacing.md },
  filaHabito: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  nombreHabito: { color: colors.text, fontSize: fontSize.sm + 1, fontWeight: '600' },
  detalleHabito: { color: colors.muted, fontSize: fontSize.xs + 1, marginTop: 2 },
  derecha: { alignItems: 'flex-end' },
  rachaValor: { color: colors.orange, fontSize: fontSize.lg, fontWeight: '800' },
  rachaMax: { color: colors.muted, fontSize: fontSize.xs },
  valorRegistro: { color: colors.teal, fontSize: fontSize.sm + 1, fontWeight: '700' },
  vacio: { color: colors.muted, fontSize: fontSize.sm },
  pie: {
    color: colors.subtle,
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
