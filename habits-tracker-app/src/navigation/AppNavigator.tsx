import { DarkTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import PantallaEstado from '../components/PantallaEstado';
import { colors } from '../constants/theme';
import { useApp } from '../context/AppContext';
import LoginScreen from '../screens/LoginScreen';
import NuevoRegistroScreen from '../screens/NuevoRegistroScreen';
import PacientesScreen from '../screens/PacientesScreen';
import ProgresoPacienteScreen from '../screens/ProgresoPacienteScreen';
import RegisterScreen from '../screens/RegisterScreen';
import type { RootStackParamList } from '../types';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Tema de navegacion alineado con la paleta de la app. */
const temaOscuro: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.surface,
    border: colors.border,
    text: colors.text,
    primary: colors.teal,
  },
};

/**
 * Stack raiz con guardia de autenticacion y de rol (authentication.md; ADR-011):
 *   sin sesion          →  Login / Registro
 *   paciente            →  Tabs / NuevoRegistro (modal)
 *   profesional         →  Pacientes / ProgresoPaciente
 * El arbol reacciona solo a la sesion y al rol: sin sesion la ruta Tabs no existe, y cada rol
 * solo tiene montadas sus propias pantallas (el servidor, ademas, responde 403 al otro rol).
 */
export default function AppNavigator() {
  const { estadoSesion, usuario, cargandoDatos, errorDatos, recargarDatos, cerrarSesion } =
    useApp();

  if (estadoSesion === 'iniciando' || (estadoSesion === 'con-sesion' && !usuario && !errorDatos)) {
    return <PantallaEstado cargando mensaje="Abriendo tu sesión…" />;
  }
  if (estadoSesion === 'con-sesion' && cargandoDatos) {
    return <PantallaEstado cargando mensaje="Cargando tus datos…" />;
  }
  if (estadoSesion === 'con-sesion' && errorDatos) {
    return (
      <PantallaEstado
        cargando={false}
        mensaje={errorDatos}
        accionPrincipal={{ titulo: 'Reintentar', onPress: () => void recargarDatos() }}
        accionSecundaria={{ titulo: 'Cerrar sesión', onPress: () => void cerrarSesion() }}
      />
    );
  }

  return (
    <NavigationContainer theme={temaOscuro}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {estadoSesion === 'con-sesion' && usuario?.rol === 'profesional' ? (
          <>
            <Stack.Screen name="Pacientes" component={PacientesScreen} />
            <Stack.Screen name="ProgresoPaciente" component={ProgresoPacienteScreen} />
          </>
        ) : estadoSesion === 'con-sesion' ? (
          <>
            <Stack.Screen name="Tabs" component={TabNavigator} />
            <Stack.Screen
              name="NuevoRegistro"
              component={NuevoRegistroScreen}
              options={{ presentation: 'modal' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Registro" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
