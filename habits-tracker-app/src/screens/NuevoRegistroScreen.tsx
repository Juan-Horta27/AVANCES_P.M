import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '../components/AppButton';
import Card from '../components/Card';
import ChipSelector from '../components/ChipSelector';
import Input from '../components/Input';
import ScreenHeader from '../components/ScreenHeader';
import { colors, fontSize, radius, spacing } from '../constants/theme';
import { useApp } from '../context/AppContext';
import type { RootStackParamList } from '../types';
import { fechaLarga, hoyISO, sumarDias } from '../utils/date';
import { aNumero } from '../utils/numeros';

/** Tiempo que se muestra el mensaje de éxito antes de cerrar el modal. */
const ESPERA_CIERRE_MS = 900;

type Props = NativeStackScreenProps<RootStackParamList, 'NuevoRegistro'>;

/**
 * Crea un registro o, si llega `registroId`, lo edita (C-04). Al editar, el hábito y la fecha
 * quedan fijos: cambiarlos sería otro registro (unicidad hábito + fecha, M-06).
 */
export default function NuevoRegistroScreen({ navigation, route }: Props) {
  const { habitosActivos, registros, metaActivaDe, habitoPorId, crearRegistro, editarRegistro } =
    useApp();
  const editado = registros.find((r) => r.id === route.params?.registroId);

  const [habitoId, setHabitoId] = useState<number | null>(
    editado?.habitoId ?? route.params?.habitoId ?? null,
  );
  const [fecha, setFecha] = useState(editado?.fecha ?? hoyISO());
  const [valor, setValor] = useState(editado ? String(editado.valorRegistrado) : '');
  const [notas, setNotas] = useState(editado?.notas ?? '');
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  /** true si se guardó en la cola sin conexión y no en el servidor (S-06). */
  const [quedoPendiente, setQuedoPendiente] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Cierre automatico tras el exito. El temporizador se cancela si el modal se cierra antes
  // (deuda registrada en screen-nuevo-registro.md: antes seguia vivo tras desmontar).
  useEffect(() => {
    if (!exito) return;
    const temporizador = setTimeout(() => navigation.goBack(), ESPERA_CIERRE_MS);
    return () => clearTimeout(temporizador);
  }, [exito, navigation]);

  const habito = habitoId !== null ? habitoPorId(habitoId) : undefined;
  const meta = habitoId !== null ? metaActivaDe(habitoId) : undefined;

  const guardar = async () => {
    setError('');
    setExito('');

    const numero = aNumero(valor);
    if (habitoId === null || !valor.trim()) {
      setError('Selecciona un hábito y escribe el valor');
      return;
    }
    if (numero === null || numero < 0) {
      setError('Ingresa un valor válido');
      return;
    }

    setEnviando(true);
    const resultado = editado
      ? await editarRegistro(editado.id, { valorRegistrado: numero, notas: notas.trim() })
      : await crearRegistro({
          habitoId,
          fecha,
          valorRegistrado: numero,
          notas: notas.trim() || undefined,
        });
    setEnviando(false);

    if (!resultado.ok) {
      setError(resultado.mensaje ?? 'No se pudo guardar el registro');
      return;
    }
    setQuedoPendiente(resultado.pendiente === true);
    setExito(resultado.mensaje ?? 'Registro guardado');
  };

  return (
    <SafeAreaView style={styles.pantalla} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.contenido}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader
            titulo={editado ? '✏️ Editar registro' : '📝 Nuevo registro'}
            subtitulo={editado ? 'Corrige el valor o las notas' : 'Anota tu avance del dia'}
            derecha={
              <Text
                style={styles.cerrar}
                onPress={() => navigation.goBack()}
                accessibilityRole="button"
                accessibilityLabel="Cerrar sin guardar"
              >
                Cerrar
              </Text>
            }
          />

          <Card>
            {error ? (
              <View style={[styles.mensaje, styles.mensajeError]}>
                <Text style={styles.textoError}>⚠️ {error}</Text>
              </View>
            ) : null}
            {exito ? (
              <View style={[styles.mensaje, styles.mensajeExito]}>
                <Text style={styles.textoExito}>
                  {quedoPendiente ? '⏳' : '✅'} {exito}
                </Text>
              </View>
            ) : null}

            <View style={styles.formulario}>
              {editado ? (
                <View style={styles.pistaMeta}>
                  <Text style={styles.pistaTexto}>
                    {habito?.nombre} · {fechaLarga(fecha)} (el hábito y la fecha no se cambian)
                  </Text>
                </View>
              ) : (
                <ChipSelector
                  etiqueta="Habito *"
                  opciones={habitosActivos.map((h) => ({ id: h.id, etiqueta: h.nombre }))}
                  seleccion={habitoId}
                  onSeleccionar={setHabitoId}
                />
              )}

              {editado ? null : (
                <View>
                  <Text style={styles.etiqueta}>FECHA *</Text>
                  <View style={styles.selectorFecha}>
                    <Text
                      style={styles.flecha}
                      onPress={() => setFecha(sumarDias(fecha, -1))}
                      accessibilityRole="button"
                      accessibilityLabel="Día anterior"
                    >
                      ‹
                    </Text>
                    <Text style={styles.fechaTexto}>{fechaLarga(fecha)}</Text>
                    <Text
                      style={[styles.flecha, fecha >= hoyISO() ? styles.flechaInactiva : null]}
                      onPress={() => {
                        if (fecha < hoyISO()) setFecha(sumarDias(fecha, 1));
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Día siguiente"
                      accessibilityState={{ disabled: fecha >= hoyISO() }}
                    >
                      ›
                    </Text>
                  </View>
                </View>
              )}

              <Input
                etiqueta={`Valor registrado * ${habito ? `(${habito.unidadMedida})` : ''}`}
                valor={valor}
                onChange={setValor}
                placeholder="8"
                tipoTeclado="numeric"
              />

              {meta ? (
                <View style={styles.pistaMeta}>
                  <Text style={styles.pistaTexto}>
                    🎯 Meta activa: {meta.valorObjetivo} {habito?.unidadMedida}
                  </Text>
                </View>
              ) : habitoId !== null ? (
                <View style={styles.pistaMeta}>
                  <Text style={styles.pistaTexto}>
                    Este habito no tiene meta activa: el registro se guardara sin cumplimiento.
                  </Text>
                </View>
              ) : null}

              <Input
                etiqueta="Notas"
                valor={notas}
                onChange={setNotas}
                placeholder="¿Como te fue hoy? (opcional)"
                multilinea
              />

              <AppButton
                titulo="Guardar registro"
                onPress={guardar}
                cargando={enviando}
                deshabilitado={Boolean(exito)}
              />
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  contenido: { padding: spacing.lg, paddingBottom: spacing.xxl },
  cerrar: { color: colors.muted, fontSize: fontSize.sm, fontWeight: '600' },
  formulario: { gap: spacing.lg },
  etiqueta: {
    color: colors.muted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  selectorFecha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  flecha: {
    color: colors.teal,
    fontSize: 26,
    fontWeight: '800',
    paddingHorizontal: spacing.sm,
    lineHeight: 30,
  },
  flechaInactiva: { color: colors.subtle },
  fechaTexto: { color: colors.text, fontSize: fontSize.sm + 1, fontWeight: '600' },
  pistaMeta: {
    backgroundColor: colors.surface2,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  pistaTexto: { color: colors.muted, fontSize: fontSize.sm, lineHeight: 19 },
  mensaje: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  mensajeError: { backgroundColor: colors.redSoft, borderColor: colors.red },
  mensajeExito: { backgroundColor: colors.greenSoft, borderColor: colors.green },
  textoError: { color: colors.red, fontSize: fontSize.sm },
  textoExito: { color: colors.green, fontSize: fontSize.sm },
});
