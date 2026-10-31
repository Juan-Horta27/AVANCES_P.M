import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
import type { Habito } from '../types';

const FORMULARIO_VACIO = { nombre: '', descripcion: '', unidadMedida: '' };

export default function HabitosScreen() {
  const {
    habitosActivos: habitos,
    categorias,
    registros,
    metaActivaDe,
    rachaDe,
    categoriaPorId,
    crearHabito,
    editarHabito,
    eliminarHabito,
  } = useApp();

  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(FORMULARIO_VACIO);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  /** null: el modal crea un hábito; un id: edita ese hábito (C-04). */
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cerrarModal = () => {
    setModalVisible(false);
    setForm(FORMULARIO_VACIO);
    setCategoriaId(null);
    setEditandoId(null);
    setError('');
  };

  const abrirEdicion = (habito: Habito) => {
    setForm({
      nombre: habito.nombre,
      descripcion: habito.descripcion ?? '',
      unidadMedida: habito.unidadMedida,
    });
    setCategoriaId(habito.categoriaHabitoId);
    setEditandoId(habito.id);
    setModalVisible(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim() || !form.unidadMedida.trim() || categoriaId === null) {
      setError('Completa nombre, unidad y categoría');
      return;
    }
    setEnviando(true);
    const resultado =
      editandoId === null
        ? await crearHabito({
            nombre: form.nombre.trim(),
            descripcion: form.descripcion.trim() || undefined,
            unidadMedida: form.unidadMedida.trim(),
            categoriaHabitoId: categoriaId,
          })
        : await editarHabito(editandoId, {
            nombre: form.nombre.trim(),
            descripcion: form.descripcion.trim(),
            unidadMedida: form.unidadMedida.trim(),
          });
    setEnviando(false);
    if (!resultado.ok) {
      setError(resultado.mensaje ?? 'No se pudo guardar el hábito');
      return;
    }
    cerrarModal();
  };

  const confirmarEliminar = async (id: number, nombre: string) => {
    if (!(await confirmar('Eliminar hábito', `¿Eliminar "${nombre}"?`, 'Eliminar'))) return;
    // El servidor borra el hábito, o lo archiva si tiene registros (ADR-008, D-10).
    const resultado = await eliminarHabito(id);
    avisar(resultado.ok ? 'Listo' : 'No se pudo eliminar', resultado.mensaje ?? '');
  };

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      <View style={styles.contenido}>
        <ScreenHeader
          titulo="📌 Habitos"
          subtitulo={`${habitos.length} habitos registrados`}
          derecha={
            <Pressable
              style={styles.botonAgregar}
              onPress={() => setModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Crear hábito"
            >
              <Text style={styles.botonAgregarTexto}>+</Text>
            </Pressable>
          }
        />

        <FlatList
          data={habitos}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icono="📌"
              titulo="Sin habitos"
              mensaje="Crea tu primer habito para empezar a hacer seguimiento."
              accion={{ titulo: '+ Crear habito', onPress: () => setModalVisible(true) }}
            />
          }
          renderItem={({ item }) => {
            const categoria = categoriaPorId(item.categoriaHabitoId);
            const meta = metaActivaDe(item.id);
            const racha = rachaDe(item.id);
            const totalRegistros = registros.filter((r) => r.habitoId === item.id).length;

            return (
              <Card>
                <View style={styles.encabezado}>
                  <Text style={styles.icono}>{categoria?.icono ?? '🏷️'}</Text>
                  <View style={styles.flex}>
                    <Text style={styles.nombre}>{item.nombre}</Text>
                    <Text style={styles.categoria}>{categoria?.nombre ?? 'Sin categoria'}</Text>
                  </View>
                  <Badge
                    texto={item.activo ? 'Activo' : 'Inactivo'}
                    color={item.activo ? colors.green : colors.muted}
                  />
                </View>

                {item.descripcion ? (
                  <Text style={styles.descripcion}>{item.descripcion}</Text>
                ) : null}

                <View style={styles.datos}>
                  <Dato etiqueta="Unidad" valor={item.unidadMedida} />
                  <Dato
                    etiqueta="Meta"
                    valor={meta ? String(meta.valorObjetivo) : '—'}
                  />
                  <Dato etiqueta="Racha" valor={`${racha.rachaActual} d`} />
                  <Dato etiqueta="Récord" valor={`${racha.rachaMaxima} d`} />
                  <Dato etiqueta="Registros" valor={String(totalRegistros)} />
                </View>

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
                    onPress={() => void confirmarEliminar(item.id, item.nombre)}
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
              {editandoId === null ? 'Nuevo hábito' : 'Editar hábito'}
            </Text>

            {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}

            <View style={styles.formulario}>
              <Input
                etiqueta="Nombre *"
                valor={form.nombre}
                onChange={(texto) => setForm({ ...form, nombre: texto })}
                placeholder="Beber agua"
              />
              {editandoId === null ? (
                <ChipSelector
                  etiqueta="Categoria *"
                  opciones={categorias.map((c) => ({
                    id: c.id,
                    etiqueta: `${c.icono ?? ''} ${c.nombre}`.trim(),
                  }))}
                  seleccion={categoriaId}
                  onSeleccionar={setCategoriaId}
                />
              ) : (
                <Text style={styles.categoriaFija}>
                  Categoría: {categoriaPorId(categoriaId ?? 0)?.nombre} (no se puede cambiar)
                </Text>
              )}
              <Input
                etiqueta="Unidad de medida *"
                valor={form.unidadMedida}
                onChange={(texto) => setForm({ ...form, unidadMedida: texto })}
                placeholder="vasos, minutos, horas..."
              />
              <Input
                etiqueta="Descripcion"
                valor={form.descripcion}
                onChange={(texto) => setForm({ ...form, descripcion: texto })}
                placeholder="Opcional"
                multilinea
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
  botonAgregar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonAgregarTexto: { color: colors.bg, fontSize: 24, fontWeight: '800', lineHeight: 28 },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icono: { fontSize: 26 },
  nombre: { color: colors.text, fontSize: fontSize.md + 1, fontWeight: '700' },
  categoria: { color: colors.muted, fontSize: fontSize.xs + 1, marginTop: 2 },
  descripcion: {
    color: colors.muted,
    fontSize: fontSize.sm,
    marginTop: spacing.md,
    lineHeight: 19,
  },
  datos: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dato: { flex: 1 },
  datoEtiqueta: { color: colors.subtle, fontSize: fontSize.xs - 1, fontWeight: '700' },
  datoValor: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600', marginTop: 2 },
  accionesTarjeta: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  categoriaFija: { color: colors.muted, fontSize: fontSize.sm },

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
