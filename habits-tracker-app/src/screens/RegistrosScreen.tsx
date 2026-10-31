import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Card from '../components/Card';
import ChipSelector from '../components/ChipSelector';
import EmptyState from '../components/EmptyState';
import ScreenHeader from '../components/ScreenHeader';
import { avisar, confirmar } from '../components/dialogos';
import { colors, fontSize, radius, spacing } from '../constants/theme';
import { useApp } from '../context/AppContext';
import type { RootStackParamList } from '../types';
import { fechaCorta } from '../utils/date';

type Navegacion = NativeStackNavigationProp<RootStackParamList>;

const TODOS = -1;

export default function RegistrosScreen() {
  const navigation = useNavigation<Navegacion>();
  const { registros, pendientes, habitos, habitoPorId, eliminarRegistro } = useApp();
  const [filtro, setFiltro] = useState<number>(TODOS);

  const visibles = useMemo(() => {
    const lista = filtro === TODOS ? registros : registros.filter((r) => r.habitoId === filtro);
    // Mas recientes primero
    return [...lista].sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [registros, filtro]);

  // Lo registrado sin conexión que aún no llega al servidor (S-06): se muestra aparte, arriba.
  const pendientesVisibles = useMemo(
    () => (filtro === TODOS ? pendientes : pendientes.filter((p) => p.habitoId === filtro)),
    [pendientes, filtro],
  );

  const confirmarEliminar = async (id: number) => {
    if (!(await confirmar('Eliminar registro', '¿Eliminar este registro diario?', 'Eliminar'))) {
      return;
    }
    const resultado = await eliminarRegistro(id);
    if (!resultado.ok) avisar('No se pudo eliminar', resultado.mensaje ?? '');
  };

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      <View style={styles.contenido}>
        <ScreenHeader
          titulo="📋 Registros"
          subtitulo={
            pendientesVisibles.length === 0
              ? `${visibles.length} registros`
              : `${visibles.length} registros · ${pendientesVisibles.length} pendientes de subir`
          }
          derecha={
            <Pressable
              style={styles.botonAgregar}
              onPress={() => navigation.navigate('NuevoRegistro')}
              accessibilityRole="button"
              accessibilityLabel="Nuevo registro"
            >
              <Text style={styles.botonAgregarTexto}>+</Text>
            </Pressable>
          }
        />

        <ChipSelector
          etiqueta="Filtrar por habito"
          opciones={[
            { id: TODOS, etiqueta: 'Todos' },
            ...habitos.map((h) => ({ id: h.id, etiqueta: h.nombre })),
          ]}
          seleccion={filtro}
          onSeleccionar={setFiltro}
        />

        <FlatList
          data={visibles}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            pendientesVisibles.length === 0 ? null : (
              <View style={styles.pendientes}>
                {pendientesVisibles.map((pendiente) => {
                  const habito = habitoPorId(pendiente.habitoId);
                  return (
                    <Card key={pendiente.clienteId} style={styles.tarjetaPendiente}>
                      <View style={styles.fila}>
                        <View style={[styles.estado, { backgroundColor: colors.surface2 }]}>
                          <Text style={styles.estadoIcono}>⏳</Text>
                        </View>
                        <View style={styles.flex}>
                          <Text style={styles.nombre}>{habito?.nombre ?? 'Habito'}</Text>
                          <Text style={styles.fecha}>
                            {fechaCorta(pendiente.fecha)} · Pendiente de subir
                          </Text>
                        </View>
                        <View style={styles.derecha}>
                          <Text style={styles.valor}>{pendiente.valorRegistrado}</Text>
                          <Text style={styles.unidad}>{habito?.unidadMedida ?? ''}</Text>
                        </View>
                      </View>
                    </Card>
                  );
                })}
              </View>
            )
          }
          ListEmptyComponent={
            pendientesVisibles.length > 0 ? null : (
              <EmptyState
                icono="📋"
                titulo="Sin registros"
                mensaje="Registra el avance de tus habitos para ver tu progreso aqui."
                accion={{
                  titulo: '+ Nuevo registro',
                  onPress: () => navigation.navigate('NuevoRegistro'),
                }}
              />
            )
          }
          renderItem={({ item }) => {
            const habito = habitoPorId(item.habitoId);
            return (
              <Card style={styles.tarjeta}>
                <View style={styles.fila}>
                  <View
                    style={[
                      styles.estado,
                      { backgroundColor: item.metaCumplida ? colors.greenSoft : colors.surface2 },
                    ]}
                  >
                    <Text style={styles.estadoIcono}>{item.metaCumplida ? '✅' : '⭕'}</Text>
                  </View>

                  <View style={styles.flex}>
                    <Text style={styles.nombre}>{habito?.nombre ?? 'Habito eliminado'}</Text>
                    <Text style={styles.fecha}>{fechaCorta(item.fecha)}</Text>
                    {item.notas ? <Text style={styles.notas}>“{item.notas}”</Text> : null}
                  </View>

                  <View style={styles.derecha}>
                    <Text
                      style={[
                        styles.valor,
                        { color: item.metaCumplida ? colors.green : colors.text },
                      ]}
                    >
                      {item.valorRegistrado}
                    </Text>
                    <Text style={styles.unidad}>{habito?.unidadMedida ?? ''}</Text>
                  </View>

                  <Pressable
                    onPress={() => navigation.navigate('NuevoRegistro', { registroId: item.id })}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Editar registro"
                  >
                    <Text style={styles.editar}>✎</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => void confirmarEliminar(item.id)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Eliminar registro"
                  >
                    <Text style={styles.eliminar}>✕</Text>
                  </Pressable>
                </View>
              </Card>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.bg },
  contenido: { flex: 1, padding: spacing.lg, gap: spacing.lg },
  flex: { flex: 1 },
  lista: { gap: spacing.sm + 2, paddingBottom: spacing.xxl },
  tarjeta: { padding: spacing.md },
  pendientes: { gap: spacing.sm + 2, marginBottom: spacing.sm + 2 },
  tarjetaPendiente: { padding: spacing.md, borderStyle: 'dashed', borderColor: colors.orange },
  botonAgregar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonAgregarTexto: { color: colors.bg, fontSize: 24, fontWeight: '800', lineHeight: 28 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  estado: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  estadoIcono: { fontSize: 18 },
  nombre: { color: colors.text, fontSize: fontSize.sm + 1, fontWeight: '600' },
  fecha: { color: colors.muted, fontSize: fontSize.xs + 1, marginTop: 2 },
  // colors.muted y no subtle: las notas son información (contraste AA, accessibility.md).
  notas: { color: colors.muted, fontSize: fontSize.xs, marginTop: 3, fontStyle: 'italic' },
  derecha: { alignItems: 'flex-end' },
  valor: { fontSize: fontSize.lg, fontWeight: '800' },
  unidad: { color: colors.muted, fontSize: fontSize.xs - 1 },
  editar: { color: colors.teal, fontSize: fontSize.lg, paddingHorizontal: spacing.xs },
  eliminar: { color: colors.red, fontSize: fontSize.lg, paddingHorizontal: spacing.xs },
});
