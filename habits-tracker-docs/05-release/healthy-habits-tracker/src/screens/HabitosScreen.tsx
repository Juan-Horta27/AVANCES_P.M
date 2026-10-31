import React, { useState } from 'react';
import {
  Alert,
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
import { colors, fontSize, radius, spacing } from '../constants/theme';
import { useApp } from '../context/AppContext';

const FORMULARIO_VACIO = { nombre: '', descripcion: '', unidadMedida: '' };

export default function HabitosScreen() {
  const {
    habitos,
    categorias,
    registros,
    metaActivaDe,
    rachaDe,
    categoriaPorId,
    crearHabito,
    eliminarHabito,
  } = useApp();

  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(FORMULARIO_VACIO);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const cerrarModal = () => {
    setModalVisible(false);
    setForm(FORMULARIO_VACIO);
    setCategoriaId(null);
    setError('');
  };

  const guardar = () => {
    if (!form.nombre.trim() || !form.unidadMedida.trim() || categoriaId === null) {
      setError('Nombre, categoria y unidad de medida son obligatorios');
      return;
    }
    crearHabito({
      nombre: form.nombre,
      descripcion: form.descripcion,
      unidadMedida: form.unidadMedida,
      categoriaHabitoId: categoriaId,
    });
    cerrarModal();
  };

  const confirmarEliminar = (id: number, nombre: string) => {
    Alert.alert('Eliminar habito', `¿Eliminar "${nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          const resultado = eliminarHabito(id);
          if (!resultado.ok) {
            Alert.alert('No se puede eliminar', resultado.mensaje);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      <View style={styles.contenido}>
        <ScreenHeader
          titulo="📌 Habitos"
          subtitulo={`${habitos.length} habitos registrados`}
          derecha={
            <Pressable style={styles.botonAgregar} onPress={() => setModalVisible(true)}>
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
                  <Dato etiqueta="Registros" valor={String(totalRegistros)} />
                </View>

                <AppButton
                  titulo="Eliminar"
                  variante="peligro"
                  onPress={() => confirmarEliminar(item.id, item.nombre)}
                  style={styles.botonEliminar}
                />
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
            <Text style={styles.tituloModal}>Nuevo habito</Text>

            {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}

            <View style={styles.formulario}>
              <Input
                etiqueta="Nombre *"
                valor={form.nombre}
                onChange={(texto) => setForm({ ...form, nombre: texto })}
                placeholder="Beber agua"
              />
              <ChipSelector
                etiqueta="Categoria *"
                opciones={categorias.map((c) => ({
                  id: c.id,
                  etiqueta: `${c.icono} ${c.nombre}`,
                }))}
                seleccion={categoriaId}
                onSeleccionar={setCategoriaId}
              />
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
              <AppButton titulo="Guardar" onPress={guardar} style={styles.flex} />
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
  botonEliminar: { marginTop: spacing.md },

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
