import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '../components/AppButton';
import Badge from '../components/Badge';
import Card from '../components/Card';
import ChipSelector from '../components/ChipSelector';
import EmptyState from '../components/EmptyState';
import Input from '../components/Input';
import ScreenHeader from '../components/ScreenHeader';
import { avisar, confirmar } from '../components/dialogos';
import { colors, fontSize, radius, spacing } from '../constants/theme';
import { useApp } from '../context/AppContext';
import type { Meta } from '../types';
import { aNumero } from '../utils/numeros';

export default function MetasScreen() {
  const {
    metas,
    habitosActivos,
    habitoPorId,
    crearMeta,
    editarMeta,
    eliminarMeta,
    alternarMeta,
  } = useApp();

  const [modalVisible, setModalVisible] = useState(false);
  const [habitoId, setHabitoId] = useState<number | null>(null);
  /** null: el modal crea una meta; un id: edita su valor y su descripción (C-04). */
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [valorObjetivo, setValorObjetivo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const activas = metas.filter((m) => m.activa).length;

  const cerrarModal = () => {
    setModalVisible(false);
    setHabitoId(null);
    setValorObjetivo('');
    setDescripcion('');
    setEditandoId(null);
    setError('');
  };

  const abrirEdicion = (meta: Meta) => {
    setHabitoId(meta.habitoId);
    setValorObjetivo(String(meta.valorObjetivo));
    setDescripcion(meta.descripcion ?? '');
    setEditandoId(meta.id);
    setModalVisible(true);
  };

  const guardar = async () => {
    const valor = aNumero(valorObjetivo);
    if (habitoId === null || !descripcion.trim() || !valorObjetivo.trim()) {
      setError('Completa todos los campos');
      return;
    }
    if (valor === null || valor <= 0) {
      setError('El valor objetivo debe ser un número mayor a 0');
      return;
    }

    setEnviando(true);
    const datos = { valorObjetivo: valor, descripcion: descripcion.trim() };
    const resultado =
      editandoId === null
        ? await crearMeta({ habitoId, ...datos })
        : await editarMeta(editandoId, datos);
    setEnviando(false);
    if (!resultado.ok) {
      setError(resultado.mensaje ?? 'No se pudo guardar la meta');
      return;
    }
    cerrarModal();
  };

  const confirmarEliminar = async (id: number) => {
    const aceptado = await confirmar(
      'Eliminar meta',
      '¿Eliminar esta meta? Los registros ya evaluados conservan su resultado.',
      'Eliminar',
    );
    if (!aceptado) return;
    const resultado = await eliminarMeta(id);
    if (!resultado.ok) avisar('No se pudo eliminar', resultado.mensaje ?? '');
  };

  const cambiarEstado = async (id: number) => {
    const resultado = await alternarMeta(id);
    if (!resultado.ok) {
      avisar('Acción no permitida', resultado.mensaje ?? '');
    }
  };

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      <View style={styles.contenido}>
        <ScreenHeader
          titulo="🎯 Metas"
          subtitulo={`${activas} activas de ${metas.length} totales`}
          derecha={
            <Pressable
              style={styles.botonAgregar}
              onPress={() => setModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Crear meta"
            >
              <Text style={styles.botonAgregarTexto}>+</Text>
            </Pressable>
          }
        />

        <FlatList
          data={metas}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icono="🎯"
              titulo="Sin metas"
              mensaje="Define una meta por habito para medir tu cumplimiento diario."
              accion={{ titulo: '+ Crear meta', onPress: () => setModalVisible(true) }}
            />
          }
          renderItem={({ item }) => {
            const habito = habitoPorId(item.habitoId);
            return (
              <Card acento={item.activa ? colors.teal : undefined}>
                <View style={styles.encabezado}>
                  <View style={styles.flex}>
                    <Text style={styles.nombre}>{habito?.nombre ?? 'Habito eliminado'}</Text>
                    <Text style={styles.descripcion}>{item.descripcion}</Text>
                  </View>
                  <Badge
                    texto={item.activa ? 'Activa' : 'Inactiva'}
                    color={item.activa ? colors.green : colors.muted}
                  />
                </View>

                <View style={styles.objetivo}>
                  <Text style={styles.objetivoValor}>{item.valorObjetivo}</Text>
                  <Text style={styles.objetivoUnidad}>
                    {habito?.unidadMedida ?? ''} al dia
                  </Text>
                </View>

                <AppButton
                  titulo={item.activa ? 'Desactivar meta' : 'Activar meta'}
                  variante="secundario"
                  onPress={() => cambiarEstado(item.id)}
                />
                <View style={styles.accionesTarjeta}>
                  <AppButton
                    titulo="Editar"
                    variante="secundario"
                    onPress={() => abrirEdicion(item)}
                    style={styles.flex}
                  />
                  <AppButton
                    titulo="Eliminar"
                    variante="peligro"
                    onPress={() => void confirmarEliminar(item.id)}
                    style={styles.flex}
                  />
                </View>
              </Card>
            );
          }}
        />
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={cerrarModal}
      >
        <View style={styles.fondoModal}>
          <View style={styles.hojaModal}>
            <View style={styles.agarre} />
            <Text style={styles.tituloModal}>
              {editandoId === null ? 'Nueva meta' : 'Editar meta'}
            </Text>

            {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}

            <View style={styles.formulario}>
              {editandoId === null ? (
                <ChipSelector
                  etiqueta="Habito *"
                  opciones={habitosActivos.map((h) => ({ id: h.id, etiqueta: h.nombre }))}
                  seleccion={habitoId}
                  onSeleccionar={setHabitoId}
                />
              ) : (
                <Text style={styles.habitoFijo}>
                  Hábito: {habitoPorId(habitoId ?? 0)?.nombre} (no se puede cambiar)
                </Text>
              )}
              <Input
                etiqueta="Valor objetivo *"
                valor={valorObjetivo}
                onChange={setValorObjetivo}
                placeholder="8"
                tipoTeclado="numeric"
              />
              <Input
                etiqueta="Descripcion *"
                valor={descripcion}
                onChange={setDescripcion}
                placeholder="8 vasos de agua al dia"
              />
            </View>

            <View style={styles.accionesModal}>
              <AppButton
                titulo="Cancelar"
                variante="secundario"
                onPress={cerrarModal}
                style={styles.flex}
              />
              <AppButton
                titulo="Guardar"
                onPress={guardar}
                cargando={enviando}
                style={styles.flex}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  accionesTarjeta: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  habitoFijo: { color: colors.muted, fontSize: fontSize.sm },
  pantalla: { flex: 1, backgroundColor: colors.bg },
  contenido: { flex: 1, padding: spacing.lg },
  flex: { flex: 1 },
  lista: { gap: spacing.md, paddingBottom: spacing.xxl },
  botonAgregar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonAgregarTexto: { color: colors.bg, fontSize: 24, fontWeight: '800', lineHeight: 28 },
  encabezado: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  nombre: { color: colors.text, fontSize: fontSize.md + 1, fontWeight: '700' },
  descripcion: { color: colors.muted, fontSize: fontSize.sm, marginTop: 3 },
  objetivo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginVertical: spacing.lg,
  },
  objetivoValor: { color: colors.teal, fontSize: fontSize.xxl, fontWeight: '800' },
  objetivoUnidad: { color: colors.muted, fontSize: fontSize.sm },

  fondoModal: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  hojaModal: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg + 6,
    borderTopRightRadius: radius.lg + 6,
    borderTopWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    paddingBottom: spacing.xxl + spacing.md,
    gap: spacing.lg,
  },
  agarre: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    alignSelf: 'center',
  },
  tituloModal: { color: colors.text, fontSize: fontSize.lg, fontWeight: '800' },
  error: { color: colors.red, fontSize: fontSize.sm },
  formulario: { gap: spacing.lg },
  accionesModal: { flexDirection: 'row', gap: spacing.md },
});
