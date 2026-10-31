import { DarkTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import { colors } from '../constants/theme';
import LoginScreen from '../screens/LoginScreen';
import NuevoRegistroScreen from '../screens/NuevoRegistroScreen';
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
 * Stack raiz:
 *   Login / Registro  →  Tabs  →  NuevoRegistro (modal)
 */
export default function AppNavigator() {
  return (
    <NavigationContainer theme={temaOscuro}>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Registro" component={RegisterScreen} />
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen
          name="NuevoRegistro"
          component={NuevoRegistroScreen}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
