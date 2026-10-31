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

  const actualizar = (campo: keyof typeof FORMULARIO_VACIO) => (texto: string) =>
    setForm((previo) => ({ ...previo, [campo]: texto }));

  const manejarRegistro = () => {
    if (!form.nombres.trim() || !form.correo.trim() || !form.contrasena.trim()) {
      setError('Nombres, correo y contrasena son obligatorios');
      return;
    }
    if (form.contrasena.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres');
      return;
    }

    setError('');
    crearCuenta({
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim() || 'Sin apellido',
      correo: form.correo.trim(),
      edad: form.edad ? Number(form.edad) : undefined,
      peso: form.peso ? Number(form.peso) : undefined,
      estatura: form.estatura ? Number(form.estatura) : undefined,
    });
    navigation.replace('Tabs');
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
                placeholder="Juan Jose"
              />
              <Input
                etiqueta="Apellidos"
                valor={form.apellidos}
                onChange={actualizar('apellidos')}
                placeholder="Horta Vanegas"
              />
              <Input
                etiqueta="Correo *"
                valor={form.correo}
                onChange={actualizar('correo')}
                placeholder="juan@correo.com"
                tipoTeclado="email-address"
              />
              <Input
                etiqueta="Contrasena * (min. 6)"
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
                  placeholder="22"
                  tipoTeclado="numeric"
                  style={styles.columna}
                />
                <Input
                  etiqueta="Peso (kg)"
                  valor={form.peso}
                  onChange={actualizar('peso')}
                  placeholder="70"
                  tipoTeclado="numeric"
                  style={styles.columna}
                />
                <Input
                  etiqueta="Estatura"
                  valor={form.estatura}
                  onChange={actualizar('estatura')}
                  placeholder="1.75"
                  tipoTeclado="numeric"
                  style={styles.columna}
                />
              </View>

              <AppButton titulo="Crear cuenta" onPress={manejarRegistro} />
            </View>

            <View style={styles.separador} />

            <View style={styles.pie}>
              <Text style={styles.pieTexto}>¿Ya tienes cuenta? </Text>
              <Pressable onPress={() => navigation.goBack()}>
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
