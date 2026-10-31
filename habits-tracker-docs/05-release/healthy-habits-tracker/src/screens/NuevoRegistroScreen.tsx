import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
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

type Props = NativeStackScreenProps<RootStackParamList, 'NuevoRegistro'>;

export default function NuevoRegistroScreen({ navigation, route }: Props) {
  const { habitos, metaActivaDe, habitoPorId, crearRegistro } = useApp();

  const [habitoId, setHabitoId] = useState<number | null>(route.params?.habitoId ?? null);
  const [fecha, setFecha] = useState(hoyISO());
  const [valor, setValor] = useState('');
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const habito = habitoId !== null ? habitoPorId(habitoId) : undefined;
  const meta = habitoId !== null ? metaActivaDe(habitoId) : undefined;

  const guardar = () => {
    setError('');
    setExito('');

    const numero = Number(valor);
    if (habitoId === null || !valor.trim()) {
      setError('Selecciona un habito e ingresa el valor registrado');
      return;
    }
    if (Number.isNaN(numero) || numero < 0) {
      setError('El valor debe ser un numero mayor o igual a cero');
      return;
    }

    const resultado = crearRegistro({
      habitoId,
      fecha,
      valorRegistrado: numero,
      notas,
    });

    if (!resultado.ok) {
      setError(resultado.mensaje ?? 'No se pudo guardar el registro');
      return;
    }

    setExito(resultado.mensaje ?? 'Registro guardado');
    setTimeout(() => navigation.goBack(), 900);
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
            titulo="📝 Nuevo registro"
            subtitulo="Anota tu avance del dia"
            derecha={
              <Text style={styles.cerrar} onPress={() => navigation.goBack()}>
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
                <Text style={styles.textoExito}>✅ {exito}</Text>
              </View>
            ) : null}

            <View style={styles.formulario}>
              <ChipSelector
                etiqueta="Habito *"
                opciones={habitos.map((h) => ({ id: h.id, etiqueta: h.nombre }))}
                seleccion={habitoId}
                onSeleccionar={setHabitoId}
              />

              <View>
                <Text style={styles.etiqueta}>FECHA *</Text>
                <View style={styles.selectorFecha}>
                  <Text
                    style={styles.flecha}
                    onPress={() => setFecha(sumarDias(fecha, -1))}
                    accessibilityLabel="Dia anterior"
                  >
                    ‹
                  </Text>
                  <Text style={styles.fechaTexto}>{fechaLarga(fecha)}</Text>
                  <Text
                    style={[styles.flecha, fecha >= hoyISO() ? styles.flechaInactiva : null]}
                    onPress={() => {
                      if (fecha < hoyISO()) setFecha(sumarDias(fecha, 1));
                    }}
                    accessibilityLabel="Dia siguiente"
                  >
                    ›
                  </Text>
                </View>
              </View>

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

              <AppButton titulo="Guardar registro" onPress={guardar} />
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
