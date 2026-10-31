import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontSize, spacing } from '../constants/theme';
import AppButton from './AppButton';

interface Accion {
  titulo: string;
  onPress: () => void;
}

interface Props {
  /** true: indicador de carga. false: mensaje de error con sus acciones. */
  cargando: boolean;
  mensaje: string;
  accionPrincipal?: Accion;
  accionSecundaria?: Accion;
}

/**
 * Pantalla completa para los estados "cargando" y "error" (semana 11: toda pantalla que carga
 * datos maneja cargando, datos y error). Un error siempre ofrece una salida (coding-standards.md).
 */
export default function PantallaEstado({
  cargando,
  mensaje,
  accionPrincipal,
  accionSecundaria,
}: Props) {
  return (
    <SafeAreaView style={styles.pantalla}>
      <View style={styles.contenido} accessibilityLiveRegion="polite">
        {cargando ? (
          <ActivityIndicator size="large" color={colors.teal} />
        ) : (
          <Text style={styles.icono}>⚠️</Text>
        )}
        <Text style={styles.mensaje}>{mensaje}</Text>
        {accionPrincipal ? (
          <AppButton titulo={accionPrincipal.titulo} onPress={accionPrincipal.onPress} />
        ) : null}
        {accionSecundaria ? (
          <AppButton
            titulo={accionSecundaria.titulo}
            onPress={accionSecundaria.onPress}
            variante="secundario"
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colors.bg },
  contenido: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  icono: { fontSize: fontSize.xxl, textAlign: 'center' },
  mensaje: { color: colors.text, fontSize: fontSize.md, textAlign: 'center' },
});
