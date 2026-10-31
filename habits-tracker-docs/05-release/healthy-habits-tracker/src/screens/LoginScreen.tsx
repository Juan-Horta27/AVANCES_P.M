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

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { iniciarSesion } = useApp();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');

  const manejarIngreso = () => {
    if (!correo.trim() || !contrasena.trim()) {
      setError('Completa todos los campos');
      return;
    }
    setError('');
    if (iniciarSesion(correo, contrasena)) {
      navigation.replace('Tabs');
    } else {
      setError('Credenciales incorrectas');
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
            <Text style={styles.titulo}>Habitos Saludables</Text>
            <Text style={styles.subtitulo}>Tu progreso diario, en un solo lugar</Text>
          </View>

          <Card>
            {error ? (
              <View style={styles.alerta}>
                <Text style={styles.alertaTexto}>⚠️ {error}</Text>
              </View>
            ) : null}

            <View style={styles.formulario}>
              <Input
                etiqueta="Correo"
                valor={correo}
                onChange={setCorreo}
                placeholder="tu@correo.com"
                tipoTeclado="email-address"
              />
              <Input
                etiqueta="Contrasena"
                valor={contrasena}
                onChange={setContrasena}
                placeholder="••••••••"
                esContrasena
              />
              <AppButton titulo="Iniciar sesion" onPress={manejarIngreso} />
            </View>

            <View style={styles.separador} />

            <View style={styles.pie}>
              <Text style={styles.pieTexto}>¿No tienes cuenta? </Text>
              <Pressable onPress={() => navigation.navigate('Registro')}>
                <Text style={styles.enlace}>Registrate aqui</Text>
              </Pressable>
            </View>
          </Card>

          <Text style={styles.nota}>
            Version inicial: cualquier correo y contrasena te dejan entrar.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  contenido: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  marca: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: { fontSize: 44 },
  titulo: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  subtitulo: {
    color: colors.muted,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  formulario: { gap: spacing.lg },
  alerta: {
    backgroundColor: colors.redSoft,
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  alertaTexto: { color: colors.red, fontSize: fontSize.sm },
  separador: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  pie: { flexDirection: 'row', justifyContent: 'center' },
  pieTexto: { color: colors.muted, fontSize: fontSize.sm },
  enlace: { color: colors.teal, fontSize: fontSize.sm, fontWeight: '700' },
  nota: {
    color: colors.subtle,
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
