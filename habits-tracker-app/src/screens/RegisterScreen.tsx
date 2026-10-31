import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '../components/AppButton';
import Card from '../components/Card';
import Input from '../components/Input';
import { colors, fontSize, radius, spacing } from '../constants/theme';
import { useApp } from '../context/AppContext';
import type { RootStackParamList } from '../types';
import { aNumero } from '../utils/numeros';

type Props = NativeStackScreenProps<RootStackParamList, 'Registro'>;

const FORMULARIO_VACIO = {
  nombres: '',
  apellidos: '',
  correo: '',
  contrasena: '',
  edad: '',
  peso: '',
  estatura: '',
};

export default function RegisterScreen({ navigation }: Props) {
  const { crearCuenta } = useApp();
  const [form, setForm] = useState(FORMULARIO_VACIO);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const actualizar = (campo: keyof typeof FORMULARIO_VACIO) => (texto: string) =>
    setForm((previo) => ({ ...previo, [campo]: texto }));

  // Solo se comprueba lo obligatorio; el resto de reglas (contraseña de 8 caracteres con
  // mayúscula y número, rangos de edad, peso y estatura) las valida el servidor y su mensaje
  // se muestra aquí (ADR-008, D-12). Así la regla vive en un solo lugar.
  const manejarRegistro = async () => {
    if (!form.nombres.trim() || !form.correo.trim() || !form.contrasena) {
      setError('Nombres, correo y contraseña son obligatorios');
      return;
    }

    setError('');
    setEnviando(true);
    const resultado = await crearCuenta({
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim() || undefined,
      correo: form.correo.trim(),
      contrasena: form.contrasena,
      edad: aNumero(form.edad) ?? undefined,
      peso: aNumero(form.peso) ?? undefined,
      estatura: aNumero(form.estatura) ?? undefined,
    });
    if (!resultado.ok) {
      setEnviando(false);
      setError(resultado.mensaje ?? 'No se pudo crear la cuenta');
    }
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
          <View style={styles.marca}>
            <Text style={styles.logo}>🌱</Text>
            <Text style={styles.titulo}>Crear cuenta</Text>
            <Text style={styles.subtitulo}>Empieza a registrar tus habitos</Text>
          </View>

          <Card>
            {error ? (
              <View style={styles.alerta}>
                <Text style={styles.alertaTexto}>⚠️ {error}</Text>
              </View>
            ) : null}

            <View style={styles.formulario}>
              <Input
                etiqueta="Nombres *"
                valor={form.nombres}
                onChange={actualizar('nombres')}
                placeholder="Tus nombres"
              />
              <Input
                etiqueta="Apellidos"
                valor={form.apellidos}
                onChange={actualizar('apellidos')}
                placeholder="Tus apellidos (opcional)"
              />
              <Input
                etiqueta="Correo *"
                valor={form.correo}
                onChange={actualizar('correo')}
                placeholder="tu@correo.com"
                tipoTeclado="email-address"
              />
              <Input
                etiqueta="Contraseña * (8+, mayúscula y número)"
                valor={form.contrasena}
                onChange={actualizar('contrasena')}
                placeholder="••••••••"
                esContrasena
              />

              <View style={styles.fila}>
                <Input
                  etiqueta="Edad"
                  valor={form.edad}
                  onChange={actualizar('edad')}
                  placeholder="Años"
                  tipoTeclado="numeric"
                  style={styles.columna}
                />
                <Input
                  etiqueta="Peso (kg)"
                  valor={form.peso}
                  onChange={actualizar('peso')}
                  placeholder="Ej. 65"
                  tipoTeclado="numeric"
                  style={styles.columna}
                />
                <Input
                  etiqueta="Estatura"
                  valor={form.estatura}
                  onChange={actualizar('estatura')}
                  placeholder="Ej. 1.70"
                  tipoTeclado="numeric"
                  style={styles.columna}
                />
              </View>

              <AppButton titulo="Crear cuenta" onPress={manejarRegistro} cargando={enviando} />
            </View>

            <View style={styles.separador} />

            <View style={styles.pie}>
              <Text style={styles.pieTexto}>¿Ya tienes cuenta? </Text>
              <Pressable
                onPress={() => navigation.goBack()}
                accessibilityRole="link"
                accessibilityLabel="Iniciar sesion"
              >
                <Text style={styles.enlace}>Iniciar sesion</Text>
              </Pressable>
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
  contenido: { padding: spacing.xl, paddingBottom: spacing.xxl },
  marca: { alignItems: 'center', marginBottom: spacing.xl },
  logo: { fontSize: 40 },
  titulo: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  subtitulo: { color: colors.muted, fontSize: fontSize.sm, marginTop: spacing.xs },
  formulario: { gap: spacing.lg },
  fila: { flexDirection: 'row', gap: spacing.sm },
  columna: { flex: 1 },
  alerta: {
    backgroundColor: colors.redSoft,
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  alertaTexto: { color: colors.red, fontSize: fontSize.sm },
  separador: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
  pie: { flexDirection: 'row', justifyContent: 'center' },
  pieTexto: { color: colors.muted, fontSize: fontSize.sm },
  enlace: { color: colors.teal, fontSize: fontSize.sm, fontWeight: '700' },
});
