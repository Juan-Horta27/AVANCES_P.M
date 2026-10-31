import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import PantallaEstado from '../components/PantallaEstado';
import ScreenHeader from '../components/ScreenHeader';
import { confirmar } from '../components/dialogos';
import { colors, fontSize, spacing } from '../constants/theme';
import { useApp } from '../context/AppContext';
import type { RootStackParamList, Usuario } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Pacientes'>;

/**
 * Inicio del profesional de bienestar (M-09, HU-02 Flujo 5): los pacientes del centro.
 * Al tocar uno se abre su progreso por rango de fechas.
 */
export default function PacientesScreen({ navigation }: Props) {
  const { usuario, cerrarSesion, listarPacientes } = useApp();
  const [pacientes, setPacientes] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    const resultado = await listarPacientes();
    setCargando(false);
    if (resultado.ok) setPacientes(resultado.datos);
    else setError(resultado.mensaje);
  }, [listarPacientes]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const confirmarCierre = async () => {
    if (await confirmar('Cerrar sesión', '¿Seguro que quieres salir?', 'Salir')) {
      await cerrarSesion();
    }
  };

  if (error) {
    return (
      <PantallaEstado
        cargando={false}
        mensaje={error}
        accionPrincipal={{ titulo: 'Reintentar', onPress: () => void cargar() }}
        accionSecundaria={{ titulo: 'Cerrar sesión', onPress: () => void cerrarSesion() }}
      />
    );
  }
  if (cargando && pacientes.length === 0) {
    return <PantallaEstado cargando mensaje="Cargando pacientes…" />;
  }

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      <View style={styles.contenido}>
        <ScreenHeader
          titulo="🩺 Pacientes"
          subtitulo={`Hola, ${usuario?.nombres.split(' ')[0] ?? ''} · ${pacientes.length} ${
            pacientes.length === 1 ? 'paciente' : 'pacientes'
          }`}
          derecha={
            <Text
              style={styles.salir}
              onPress={() => void confirmarCierre()}
              accessibilityRole="button"
              accessibilityLabel="Cerrar sesión"
            >
              Salir
            </Text>
          }
        />

        <FlatList
          data={pacientes}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          refreshing={cargando}
          onRefresh={() => void cargar()}
          ListEmptyComponent={
            <EmptyState
              icono="🩺"
              titulo="Sin pacientes"
              mensaje="Todavía no hay pacientes registrados en el centro."
            />
          }
          renderItem={({ item }) => {
            const nombre = [item.nombres, item.apellidos].filter(Boolean).join(' ');
            return (
              <Pressable
                onPress={() =>
                  navigation.navigate('ProgresoPaciente', { usuarioId: item.id, nombre })
                }
                accessibilityRole="button"
                accessibilityLabel={`Ver el progreso de ${nombre}`}
              >
                <Card>
                  <View style={styles.encabezado}>
                    <View style={styles.flex}>
                      <Text style={styles.nombre}>{nombre}</Text>
                      <Text style={styles.correo}>{item.correo}</Text>
                    </View>
                    <Text style={styles.ver}>Ver progreso ›</Text>
                  </View>
                  <View style={styles.datos}>
                    <Dato etiqueta="Edad" valor={item.edad === null ? '—' : `${item.edad} años`} />
                    <Dato etiqueta="Peso" valor={item.peso === null ? '—' : `${item.peso} kg`} />
                    <Dato
                      etiqueta="Estatura"
                      valor={item.estatura === null ? '—' : `${item.estatura} m`}
                    />
                  </View>
                </Card>
              </Pressable>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.dato}>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
      <Text style={styles.datoValor}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.bg },
  contenido: { flex: 1, padding: spacing.lg },
  flex: { flex: 1 },
  lista: { gap: spacing.md, paddingBottom: spacing.xxl },
  salir: { color: colors.red, fontSize: fontSize.sm, fontWeight: '600' },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  nombre: { color: colors.text, fontSize: fontSize.md + 1, fontWeight: '700' },
  correo: { color: colors.muted, fontSize: fontSize.xs + 1, marginTop: 2 },
  ver: { color: colors.teal, fontSize: fontSize.sm, fontWeight: '600' },
  datos: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dato: { flex: 1 },
  datoEtiqueta: { color: colors.muted, fontSize: fontSize.xs, fontWeight: '700' },
  datoValor: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600', marginTop: 2 },
});
