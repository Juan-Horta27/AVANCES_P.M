import React, { useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
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

export default function MetasScreen() {
  const { metas, habitos, habitoPorId, crearMeta, alternarMeta } = useApp();

  const [modalVisible, setModalVisible] = useState(false);
  const [habitoId, setHabitoId] = useState<number | null>(null);
  const [valorObjetivo, setValorObjetivo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');

  const activas = metas.filter((m) => m.activa).length;

  const cerrarModal = () => {
    setModalVisible(false);
    setHabitoId(null);
    setValorObjetivo('');
    setDescripcion('');
    setError('');
  };

  const guardar = () => {
    const valor = Number(valorObjetivo);
    if (habitoId === null || !descripcion.trim() || !valorObjetivo.trim()) {
      setError('Todos los campos son obligatorios');
      return;
    }
    if (Number.isNaN(valor) || valor <= 0) {
      setError('El valor objetivo debe ser un numero mayor que cero');
      return;
    }

    const resultado = crearMeta({ habitoId, valorObjetivo: valor, descripcion });
    if (!resultado.ok) {
      setError(resultado.mensaje ?? 'No se pudo crear la meta');
      return;
    }
    cerrarModal();
  };

  const cambiarEstado = (id: number) => {
    const resultado = alternarMeta(id);
    if (!resultado.ok) {
      Alert.alert('Accion no permitida', resultado.mensaje);
    }
  };

  return (
    <SafeAreaView style={styles.pantalla} edges={['top']}>
      <View style={styles.contenido}>
        <ScreenHeader
          titulo="🎯 Metas"
          subtitulo={`${activas} activas de ${metas.length} totales`}
          derecha={
            <Pressable style={styles.botonAgregar} onPress={() => setModalVisible(true)}>
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
            <Text style={styles.tituloModal}>Nueva meta</Text>

            {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}

            <View style={styles.formulario}>
              <ChipSelector
                etiqueta="Habito *"
                opciones={habitos.map((h) => ({ id: h.id, etiqueta: h.nombre }))}
                seleccion={habitoId}
                onSeleccionar={setHabitoId}
              />
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
              <AppButton titulo="Guardar" onPress={guardar} style={styles.flex} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
